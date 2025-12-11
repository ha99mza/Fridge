package backend


import (
	"bytes"
	"context"
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
	"sync/atomic"
	"time"

	"github.com/tarm/serial"
)

// ======================= Types =======================

type App struct {
	ctx         context.Context
	temperature atomic.Value // contient toujours la DERNIÈRE valeur reçue du port série (float64)
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

// ======================= Initialisation =======================

func NewApp() *App {
	app := &App{}
	//app.temperature.Store(math.NaN())0.0
	
	app.temperature.Store(4.5)
	return app
}

func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
	url := "https://cloud.digisense.es/api/v1/deviceapi/event" 
	bearerToken := "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjI1LCJ0ZW5hbnRJZCI6NSwiZW1haWwiOiJ5Lm1zYWxhQG5leHRyb25pYy5pbyIsInJvbGUiOiIiLCJwZXJtaXNzaW9ucyI6W10sImlhdCI6MTc1ODMxODM1NSwiZXhwIjoxNzg5ODU0MzU1fQ.u6sPUgNlPvAqKkrsLJA7CzpBXgi6dWxNePKND5LXCo0"

	

	go a.startSerialReader(ctx, "COM2")


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

// ======================= Lecture Série =======================

func (a *App) startSerialReader(ctx context.Context, portName string) {
	config := &serial.Config{
		Name:        "COM10",
		Baud:        115200,
		ReadTimeout: 1,
		Size:        8,
	}

	log.Println("Config port série:", config)
	port, err := serial.OpenPort(config)
	if err != nil {
		log.Println("Erreur ouverture port série:", err)
		return
	}
	defer port.Close()

	log.Println("Port série ouvert sur", portName, "à 115200 bauds")

	buf := make([]byte, 256)
	var lineBuf bytes.Buffer

	for {
		select {
		case <-ctx.Done():
			log.Println("Arrêt lecture série (ctx.Done)")
			return
		default:
			n, err := port.Read(buf)
			if err != nil {
				if err == io.EOF {
					continue
				}
				log.Println("Erreur lecture série:", err)
				// on continue, mais tu peux aussi décider de break/return
				continue
			}

			if n <= 0 {
				continue
			}

			// Ajoute ce qui vient d’être lu au buffer de ligne
			lineBuf.Write(buf[:n])

			// On traite ligne par ligne (séparateur '\n')
			for {
				data := lineBuf.Bytes()
				idx := bytes.IndexByte(data, '\n')
				if idx < 0 {
					// pas de ligne complète pour l’instant
					break
				}

				line := string(data[:idx])
				// on consomme cette ligne (+ le '\n')
				lineBuf.Next(idx + 1)

				line = strings.TrimSpace(line)
				if line == "" {
					continue
				}
				//log.Println("Ligne reçue du port série:", line)

				temp, err := parseSerialTemp(line)
				if err != nil {
					log.Println("Ligne série invalide:", line, "err:", err)
					continue
				}

				// On met à jour la valeur globale
				a.temperature.Store(temp)
				// Optionnel : log pour debug
				//log.Println("Temp reçue du port série:", temp)
			}
		}
	}
}

// Essaie de parser la température à partir d’une ligne reçue
// Gère par exemple :
//
//	{"temp": 18.5}
//	18.5
func parseSerialTemp(line string) (float64, error) {
	line = strings.TrimSpace(line)

	// Cas JSON
	if strings.HasPrefix(line, "{") {
		var obj struct {
			Temp float64 `json:"temp"`
		}
		if err := json.Unmarshal([]byte(line), &obj); err != nil {
			return 0, fmt.Errorf("JSON invalide: %w", err)
		}
		return obj.Temp, nil
	}

	// Cas valeur simple
	value, err := strconv.ParseFloat(line, 64)
	if err != nil {
		return 0, fmt.Errorf("valeur numérique invalide: %w", err)
	}

	return value, nil
}

// ======================= Utilisation de la température =======================

// GetTemperature retourne la dernière valeur reçue du port série
// et l’envoie à ton API comme avant.
func (a *App) GetTemperature() float64 {
/* 	url := "https://cloud.digisense.es/api/v1/deviceapi/event" // TODO: mettre ton URL
	bearerToken := "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjI1LCJ0ZW5hbnRJZCI6NSwiZW1haWwiOiJ5Lm1zYWxhQG5leHRyb25pYy5pbyIsInJvbGUiOiIiLCJwZXJtaXNzaW9ucyI6W10sImlhdCI6MTc1ODMxODM1NSwiZXhwIjoxNzg5ODU0MzU1fQ.u6sPUgNlPvAqKkrsLJA7CzpBXgi6dWxNePKND5LXCo0"
 */
	v := a.temperature.Load()
	if v == nil {
		return math.NaN()
	}

	temp, ok := v.(float64)
	if !ok || math.IsNaN(temp) {
		return math.NaN()
	}

	/* payload := TempPayload{
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
	} */

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
func (a *App) DefrostSettingsUpdate(defrost string)  {
    
 
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
	bearerToken := "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjI1LCJ0ZW5hbnRJZCI6NSwiZW1haWwiOiJ5Lm1zYWxhQG5leHRyb25pYy5pbyIsInJvbGUiOiIiLCJwZXJtaXNzaW9ucyI6W10sImlhdCI6MTc1ODMxODM1NSwiZXhwIjoxNzg5ODU0MzU1fQ.u6sPUgNlPvAqKkrsLJA7CzpBXgi6dWxNePKND5LXCo0" // TODO

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

// Liste tous les SSID disponibles (Linux + Windows)
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

// Se connecte à un Wi-Fi par SSID + mot de passe (Linux + Windows)
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

/* ======================= LINUX ======================= */

func listWifiLinux() ([]string, error) {
	// nmcli -t -f SSID dev wifi
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
		// nmcli peut renvoyer des SSID en double → on filtre
		if !seen[s] {
			seen[s] = true
			ssids = append(ssids, s)
		}
	}
	return ssids, nil
}

func connectWifiLinux(ssid, password string) error {
	// nmcli dev wifi connect "SSID" password "PASS"
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

/* ======================= WINDOWS ======================= */

func listWifiWindows() ([]string, error) {
	// netsh wlan show networks mode=Bssid
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
		// lignes du type : "SSID 1 : MonWifi"
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

	// On génère un profil XML temporaire pour Windows (WPA2-Personal / AES)
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

	// netsh wlan add profile filename="xxx.xml"
	cmdAdd := exec.Command("netsh", "wlan", "add", "profile", fmt.Sprintf("filename=%s", tmpFile.Name()))
	var stderrAdd bytes.Buffer
	cmdAdd.Stderr = &stderrAdd
	if err := cmdAdd.Run(); err != nil {
		return fmt.Errorf("échec add profile : %v (%s)", err, stderrAdd.String())
	}

	// netsh wlan connect name="SSID"
	cmdConn := exec.Command("netsh", "wlan", "connect", fmt.Sprintf("name=%s", ssid))
	var stderrConn bytes.Buffer
	cmdConn.Stderr = &stderrConn
	if err := cmdConn.Run(); err != nil {
		return fmt.Errorf("échec connexion : %v (%s)", err, stderrConn.String())
	}

	return nil
}

// Informations reseau de l'appareil
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
