declare module "react-simple-keyboard" {
  import * as React from "react";

  export type KeyboardReactInterface = {
    setInput: (value: string) => void;
    getInput?: () => string;
    // Ajoutez d'autres méthodes si vous en avez besoin
    [key: string]: any;
  };

  export interface KeyboardProps extends React.ComponentProps<any> {
    keyboardRef?: (ref: KeyboardReactInterface | null) => void;
    layout?: any;
    layoutName?: string;
    onChange?: (input: string) => void;
    onKeyPress?: (button: string) => void;
    display?: Record<string, string>;
    theme?: string;
  }

  const Keyboard: React.ComponentType<KeyboardProps>;
  export default Keyboard;
}