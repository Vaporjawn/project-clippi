import * as React from "react";

import { HashRouter as Router } from "react-router-dom";
import { MainView } from "@/views/main/MainView";
import { ThemeProvider } from "styled-components";
import { lightTheme, darkTheme, useTheme, ThemeMode } from "@/styles";

const App: React.FC = () => {
    const theme = useTheme();

    return (
        <ThemeProvider theme={theme.themeName === ThemeMode.LIGHT ? lightTheme : darkTheme}>
            <div>
                <button onClick={() => {
                    console.log("buton clicked");
                    theme.toggle()
                }} style={{position: "absolute", zIndex: 99}}>
                    {theme.themeName === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                </button>
                <Router>
                    <MainView />
                </Router>

            </div>
        </ThemeProvider>
    );
};

export default App;