package backend

import (
	"bytes"
	"context"
	"encoding/binary"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"math"
	"net"
	"net/http"
	"os"
	"os/exec"
	"runtime"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"go.einride.tech/can"
	"go.einride.tech/can/pkg/socketcan"
)

// ======================= Types =======================

type App struct {
	ctx         context.Context
	temperature atomic.Value // contient toujours la DERNIÈRE valeur reçue du CAN (float64)

	// Pour la gestion de la session CAN
	mu      sync.Mutex
	session *canSession
}

type canSession struct {
	iface  string
	ctx    context.Context
	cancel context.CancelFunc
	conn   net.Conn
	rx     *socketcan.Receiver
	tx     *socketcan.Transmitter
	done   chan struct{}
}

type TempData struct {
	Temp     float64 `json:"temp"`
	Datetime string  `json:"datetime"`
}

type TempPayload struct {
	Serial      string   `json:"serial"`
	AccessToken string   `json:"accessToken"`
	Data        TempData `json:"data"`
}

type historyRecord struct {
	ID        int               `json:"id"`
	DeviceID  int               `json:"deviceId"`
	CreatedAt string            `json:"createdAt"`
	Data      historyRecordData `json:"data"`
}

type CANFrameEvent struct {
	Timestamp time.Time `json:"timestamp"`
	ID        uint32    `json:"id"`
	Data      []uint32  `json:"data"`
}

type historyRecordData struct {
	Temp     json.RawMessage `json:"temp"`
	Datetime string          `json:"datetime"`
}

type HistoryEntry struct {
	Temp     float64 `json:"temp"`
	Datetime string  `json:"datetime"`
}

type DeviceNetworkInfo struct {
	IP  string `json:"ip"`
	MAC string `json:"mac"`
}

// Configuration pour le décodage de la température depuis CAN
const (
	TEMP_CAN_ID       = 0x123 // ID de la frame CAN contenant la température
	TEMP_CAN_INTERFACE = "can0" // Interface CAN à utiliser (can0, vcan0, etc.)
)

// ======================= Initialisation =======================

func NewApp() *App {
	app := &App{}
	// Initialisation avec une valeur par défaut
	app.temperature.Store(4.5)
	return app
}

func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
	url := "https://cloud.digisense.es/api/v1/deviceapi/event"
	bearerToken := "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjI1LCJ0ZW5hbnRJZCI6NSwiZW1haWwiOiJ5Lm1zYWxhQG5leHRyb25pYy5pbyIsInJvbGUiOiIiLCJwZXJtaXNzaW9ucyI6W10sImlhdCI6MTc1ODMxODM1NSwiZXhwIjoxNzg5ODU0MzU1fQ.u6sPUgNlPvAqKkrsLJA7CzpBXgi6dWxNePKND5LXCo0"

	// Démarrage de la lecture CAN au lieu du port série
	go func() {
		if err := a.startCANReader(ctx, TEMP_CAN_INTERFACE); err != nil {
			log.Println("Erreur démarrage CAN:", err)
		}
	}()

	// Ticker pour l'envoi périodique vers l'API
	go func() {
		ticker := time.NewTicker(10 * time.Second)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				log.Println("Arrêt du ticker 10s (ctx.Done)")
				return
			case <-ticker.C:
				temp, ok := a.temperature.Load().(float64)
				if !ok || math.IsNaN(temp) {
					continue
				}

				payload := TempPayload{
					Serial:      "0P163HXRE9JH",
					AccessToken: "64E9IZ8Y",
					Data: TempData{
						Temp:     math.Round(temp*100) / 100,
						Datetime: time.Now().UTC().Format("2006-01-02t15:04:05.000z"),
					},
				}

				// Envoi vers ton API
				if _, err := SendTemperature(url, bearerToken, payload); err != nil {
					log.Println("Erreur SendTemperature:", err)
				}
			}
		}
	}()
}

func (a *App) Shutdown(ctx context.Context) {
	_ = a.StopCAN()
}

// ======================= Lecture CAN =======================

func (a *App) startCANReader(ctx context.Context, iface string) error {
	iface = strings.TrimSpace(iface)
	if iface == "" {
		iface = "can0"
	}

	a.mu.Lock()
	if a.session != nil {
		a.mu.Unlock()
		return errors.New("CAN déjà démarré")
	}
	canCtx, cancel := context.WithCancel(ctx)
	sess := &canSession{
		iface:  iface,
		ctx:    canCtx,
		cancel: cancel,
		done:   make(chan struct{}),
	}
	a.session = sess
	a.mu.Unlock()

	conn, err := socketcan.DialContext(canCtx, "can", iface)
	if err != nil {
		if canCtx.Err() == nil {
			log.Printf("Erreur dial CAN %s: %v\n", iface, err)
		}
		cancel()
		close(sess.done)
		a.mu.Lock()
		if a.session == sess {
			a.session = nil
		}
		a.mu.Unlock()
		return err
	}

	if canCtx.Err() != nil {
		_ = conn.Close()
		cancel()
		close(sess.done)
		a.mu.Lock()
		if a.session == sess {
			a.session = nil
		}
		a.mu.Unlock()
		return canCtx.Err()
	}

	a.mu.Lock()
	sess.conn = conn
	sess.rx = socketcan.NewReceiver(conn)
	sess.tx = socketcan.NewTransmitter(conn)
	a.mu.Unlock()

	log.Printf("CAN ouvert sur interface %s\n", iface)

	go a.receiveCANLoop(sess)
	return nil
}

func (a *App) receiveCANLoop(sess *canSession) {
	defer func() {
		close(sess.done)
		if sess.conn != nil {
			_ = sess.conn.Close()
		}
		a.mu.Lock()
		if a.session == sess {
			a.session = nil
		}
		a.mu.Unlock()
		log.Println("Arrêt boucle réception CAN")
	}()

	for sess.rx.Receive() {
		if sess.ctx.Err() != nil {
			return
		}

		if sess.rx.HasErrorFrame() {
			if sess.ctx.Err() == nil {
				ef := sess.rx.ErrorFrame()
				log.Printf("CAN error frame: class=%s controller=%s protocol=%s location=%s transceiver=%s\n",
					ef.ErrorClass,
					ef.ControllerError,
					ef.ProtocolError,
					ef.ProtocolViolationErrorLocation,
					ef.TransceiverError,
				)
			}
			continue
		}

		frame := sess.rx.Frame()

		// Filtrer uniquement les frames avec l'ID température
		if frame.ID == TEMP_CAN_ID {
			temp, err := decodeTemperatureFromCAN(frame)
			if err != nil {
				log.Printf("Erreur décodage température CAN ID=0x%X: %v\n", frame.ID, err)
				continue
			}

			// Stocker la température décodée
			a.temperature.Store(temp)
			log.Printf("Température reçue du CAN: %.2f°C (ID=0x%X)\n", temp, frame.ID)
		}
	}

	if err := sess.rx.Err(); err != nil && sess.ctx.Err() == nil && !errors.Is(err, net.ErrClosed) {
		log.Printf("Erreur réception CAN: %v\n", err)
	}
}

// ======================= Décodage Température =======================

// decodeTemperatureFromCAN décode la température depuis une frame CAN
// Plusieurs formats possibles :
// 1. Float32 (4 bytes) - Little Endian
// 2. Int16 avec facteur (2 bytes) - température * 100
// 3. Int16 avec facteur (2 bytes) - température * 10
// Adaptez selon votre protocole CAN
func decodeTemperatureFromCAN(frame can.Frame) (float64, error) {
	if frame.Length < 2 {
		return 0, fmt.Errorf("frame trop courte: %d bytes", frame.Length)
	}

	// ===== OPTION 1: Float32 (4 bytes) =====
	// Si la température est encodée en float32 sur les 4 premiers bytes
	if frame.Length >= 4 {
		bits := binary.LittleEndian.Uint32(frame.Data[0:4])
		temp := math.Float32frombits(bits)
		if !math.IsNaN(float64(temp)) && !math.IsInf(float64(temp), 0) {
			return float64(temp), nil
		}
	}

	// ===== OPTION 2: Int16 * 100 (température en centièmes) =====
	// Exemple: 2550 = 25.50°C
	if frame.Length >= 2 {
		raw := int16(binary.LittleEndian.Uint16(frame.Data[0:2]))
		temp := float64(raw) / 100.0
		if temp >= -100.0 && temp <= 200.0 { // Plage de température raisonnable
			return temp, nil
		}
	}

	// ===== OPTION 3: Int16 * 10 (température en dixièmes) =====
	// Exemple: 255 = 25.5°C
	// if frame.Length >= 2 {
	// 	raw := int16(binary.LittleEndian.Uint16(frame.Data[0:2]))
	// 	temp := float64(raw) / 10.0
	// 	if temp >= -100.0 && temp <= 200.0 {
	// 		return temp, nil
	// 	}
	// }

	// ===== OPTION 4: Byte unique (température entière) =====
	// temp := float64(int8(frame.Data[0]))
	// return temp, nil

	return 0, fmt.Errorf("format de température non reconnu")
}

// ======================= Gestion CAN =======================

// StopCAN arrête la réception CAN
func (a *App) StopCAN() error {
	a.mu.Lock()
	sess := a.session
	var cancel context.CancelFunc
	var conn net.Conn
	var done chan struct{}
	if sess != nil {
		cancel = sess.cancel
		conn = sess.conn
		done = sess.done
	}
	a.mu.Unlock()

	if sess == nil {
		return nil
	}

	if cancel != nil {
		cancel()
	}
	if conn != nil {
		_ = conn.Close()
	}
	<-done

	a.mu.Lock()
	if a.session == sess {
		a.session = nil
	}
	a.mu.Unlock()
	return nil
}

// SendCANFrame envoie une frame CAN (utile pour tester ou commander)
func (a *App) SendCANFrame(id uint32, data []byte, extended bool) error {
	if len(data) > 8 {
		return fmt.Errorf("data length must be <= 8 (got %d)", len(data))
	}

	a.mu.Lock()
	var tx *socketcan.Transmitter
	if a.session != nil {
		tx = a.session.tx
	}
	a.mu.Unlock()

	if tx == nil {
		return errors.New("CAN non démarré")
	}

	var d can.Data
	copy(d[:], data)
	f := can.Frame{
		ID:         id,
		Length:     uint8(len(data)),
		Data:       d,
		IsExtended: extended,
	}
	if err := f.Validate(); err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel()
	if err := tx.TransmitFrame(ctx, f); err != nil {
		return err
	}
	return nil
}

// ======================= Utilisation de la température =======================

// GetTemperature retourne la dernière valeur reçue du CAN
func (a *App) GetTemperature() float64 {
	v := a.temperature.Load()
	if v == nil {
		return math.NaN()
	}

	temp, ok := v.(float64)
	if !ok || math.IsNaN(temp) {
		return math.NaN()
	}

	return temp
}

// ======================= Envoi API Température =======================

func SendTemperature(url, bearerToken string, payload TempPayload) ([]byte, error) {
	jsonData, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("erreur encodage JSON : %w", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("erreur création requête : %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+bearerToken)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("erreur appel API : %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("erreur lecture réponse : %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("API statut %d : %s", resp.StatusCode, string(body))
	}

	return body, nil
}

// ======================= Historique =======================

func (a *App) FetchHistoryRaw(url, bearerToken string) ([]byte, error) {
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("erreur création requête: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+bearerToken)
	client := &http.Client{Timeout: 10 * time.Second}

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("erreur appel API: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("erreur lecture réponse: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("API statut %d : %s", resp.StatusCode, string(body))
	}

	return body, nil
}

func (a *App) DefrostSettingsUpdate(defrost string) {

}

func (a *App) GetDefrostSettings() (string, error) {
	return "1h", nil
}

func (a *App) GetHistoryData(rng string) ([]HistoryEntry, error) {

	layout := "2006-01-02T15:04"
	now := time.Now()

	urltime := ""

	switch rng {
	case "1h":
		urltime = now.Add(-1 * time.Hour).Format(layout)
	case "1d":
		urltime = now.AddDate(0, 0, -1).Format(layout)
	case "1w":
		urltime = now.AddDate(0, 0, -7).Format(layout)
	default:
		urltime = ""
	}
	url := "https://cloud.digisense.es/api/v1/entityEvents?serial=6LHOCE0F&tenantId=5&from=" + urltime + "&to=" + now.Format(layout)
	bearerToken := "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjI1LCJ0ZW5hbnRJZCI6NSwiZW1haWwiOiJ5Lm1zYWxhQG5leHRyb25pYy5pbyIsInJvbGUiOiIiLCJwZXJtaXNzaW9ucyI6W10sImlhdCI6MTc1ODMxODM1NSwiZXhwIjoxNzg5ODU0MzU1fQ.u6sPUgNlPvAqKkrsLJA7CzpBXgi6dWxNePKND5LXCo0"

	raw, err := a.FetchHistoryRaw(url, bearerToken)
	if err != nil {
		return nil, err
	}

	var records []historyRecord
	if err := json.Unmarshal(raw, &records); err != nil {
		return nil, fmt.Errorf("erreur parsing JSON: %w", err)
	}

	history := make([]HistoryEntry, 0, len(records))
	for _, rec := range records {
		tempValue, err := parseTempValue(rec.Data.Temp)
		if err != nil {
			continue
		}

		datetime := rec.Data.Datetime
		if datetime == "" {
			datetime = rec.CreatedAt
		}

		history = append(history, HistoryEntry{
			Temp:     tempValue,
			Datetime: datetime,
		})
	}

	return history, nil
}

func parseTempValue(raw json.RawMessage) (float64, error) {
	var asFloat float64
	if err := json.Unmarshal(raw, &asFloat); err == nil {
		return asFloat, nil
	}

	var asString string
	if err := json.Unmarshal(raw, &asString); err == nil {
		value := strings.TrimSpace(asString)
		if value == "" {
			return 0, fmt.Errorf("valeur vide")
		}
		return strconv.ParseFloat(value, 64)
	}

	return 0, fmt.Errorf("format temp inconnu")
}

// ======================= WiFi =======================

func (a *App) ListWifiSSIDs() ([]string, error) {
	switch runtime.GOOS {
	case "linux":
		return listWifiLinux()
	case "windows":
		return listWifiWindows()
	default:
		return nil, fmt.Errorf("OS %s non supporté", runtime.GOOS)
	}
}

func (a *App) ConnectToWifi(ssid, password string) error {
	if ssid == "" {
		return errors.New("SSID vide")
	}
	switch runtime.GOOS {
	case "linux":
		return connectWifiLinux(ssid, password)
	case "windows":
		return connectWifiWindows(ssid, password)
	default:
		return fmt.Errorf("OS %s non supporté", runtime.GOOS)
	}
}

func listWifiLinux() ([]string, error) {
	cmd := exec.Command("nmcli", "-t", "-f", "SSID", "dev", "wifi")
	out, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("erreur nmcli : %w", err)
	}

	lines := strings.Split(string(out), "\n")
	seen := make(map[string]bool)
	var ssids []string

	for _, l := range lines {
		s := strings.TrimSpace(l)
		if s == "" {
			continue
		}
		if !seen[s] {
			seen[s] = true
			ssids = append(ssids, s)
		}
	}
	return ssids, nil
}

func connectWifiLinux(ssid, password string) error {
	args := []string{"dev", "wifi", "connect", ssid}
	if password != "" {
		args = append(args, "password", password)
	}

	cmd := exec.Command("nmcli", args...)
	var stderr bytes.Buffer
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("échec connexion nmcli : %v (%s)", err, stderr.String())
	}
	return nil
}

func listWifiWindows() ([]string, error) {
	cmd := exec.Command("netsh", "wlan", "show", "networks", "mode=Bssid")
	out, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("erreur netsh : %w", err)
	}

	lines := strings.Split(string(out), "\n")
	seen := make(map[string]bool)
	var ssids []string

	for _, l := range lines {
		line := strings.TrimSpace(l)
		if strings.HasPrefix(line, "SSID ") {
			parts := strings.SplitN(line, ":", 2)
			if len(parts) == 2 {
				s := strings.TrimSpace(parts[1])
				if s != "" && !seen[s] {
					seen[s] = true
					ssids = append(ssids, s)
				}
			}
		}
	}
	return ssids, nil
}

func connectWifiWindows(ssid, password string) error {
	if password == "" {
		return errors.New("pour cet exemple, mot de passe obligatoire (WPA2-Personal)")
	}

	profile := fmt.Sprintf(`<?xml version="1.0"?>
<WLANProfile xmlns="http://www.microsoft.com/networking/WLAN/profile/v1">
    <name>%[1]s</name>
    <SSIDConfig>
        <SSID>
            <name>%[1]s</name>
        </SSID>
    </SSIDConfig>
    <connectionType>ESS</connectionType>
    <connectionMode>manual</connectionMode>
    <MSM>
        <security>
            <authEncryption>
                <authentication>WPA2PSK</authentication>
                <encryption>AES</encryption>
                <useOneX>false</useOneX>
            </authEncryption>
            <sharedKey>
                <keyType>passPhrase</keyType>
                <protected>false</protected>
                <keyMaterial>%[2]s</keyMaterial>
            </sharedKey>
        </security>
    </MSM>
</WLANProfile>`, ssid, password)

	tmpFile, err := os.CreateTemp("", "wifi-profile-*.xml")
	if err != nil {
		return fmt.Errorf("erreur création fichier profil : %w", err)
	}
	defer os.Remove(tmpFile.Name())

	if _, err := tmpFile.WriteString(profile); err != nil {
		return fmt.Errorf("erreur écriture profil : %w", err)
	}
	tmpFile.Close()

	cmdAdd := exec.Command("netsh", "wlan", "add", "profile", fmt.Sprintf("filename=%s", tmpFile.Name()))
	var stderrAdd bytes.Buffer
	cmdAdd.Stderr = &stderrAdd
	if err := cmdAdd.Run(); err != nil {
		return fmt.Errorf("échec add profile : %v (%s)", err, stderrAdd.String())
	}

	cmdConn := exec.Command("netsh", "wlan", "connect", fmt.Sprintf("name=%s", ssid))
	var stderrConn bytes.Buffer
	cmdConn.Stderr = &stderrConn
	if err := cmdConn.Run(); err != nil {
		return fmt.Errorf("échec connexion : %v (%s)", err, stderrConn.String())
	}

	return nil
}

// ======================= Network Info =======================

func (a *App) GetDeviceNetworkInfo() (DeviceNetworkInfo, error) {
	ip, mac, err := findPrimaryIPAndMAC()
	if err != nil {
		return DeviceNetworkInfo{}, err
	}
	return DeviceNetworkInfo{
		IP:  ip,
		MAC: mac,
	}, nil
}

func findPrimaryIPAndMAC() (string, string, error) {
	interfaces, err := net.Interfaces()
	if err != nil {
		return "", "", fmt.Errorf("impossible de lire les interfaces reseau: %w", err)
	}

	for _, iface := range interfaces {
		if iface.Flags&net.FlagUp == 0 || iface.Flags&net.FlagLoopback != 0 {
			continue
		}

		addrs, err := iface.Addrs()
		if err != nil {
			continue
		}

		var ipv4 string
		for _, addr := range addrs {
			var ipNet *net.IPNet
			switch v := addr.(type) {
			case *net.IPNet:
				ipNet = v
			case *net.IPAddr:
				ipNet = &net.IPNet{IP: v.IP, Mask: v.IP.DefaultMask()}
			}
			if ipNet == nil {
				continue
			}
			ip := ipNet.IP.To4()
			if ip == nil || ip.IsLoopback() {
				continue
			}
			ipv4 = ip.String()
			break
		}

		if ipv4 != "" && len(iface.HardwareAddr) > 0 {
			return ipv4, iface.HardwareAddr.String(), nil
		}
	}

	return "", "", errors.New("aucune interface reseau active detectee")
}