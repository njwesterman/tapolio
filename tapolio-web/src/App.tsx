// src/App.tsx
import { Redirect, Route } from "react-router-dom";
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { chatbubbles, school } from "ionicons/icons";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import InterviewQuiz from "./pages/InterviewQuiz";

import { setupIonicReact } from "@ionic/react";

import "@ionic/react/css/core.css";
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <IonRouterOutlet>
        {/* Landing Page */}
        <Route exact path="/">
          <Landing />
        </Route>
        
        {/* App with Tabs */}
        <Route path="/app">
          <IonTabs>
            <IonRouterOutlet>
              <Route exact path="/app/copilot">
                <Home />
              </Route>
              <Route exact path="/app/quiz">
                <InterviewQuiz />
              </Route>
              <Route exact path="/app">
                <Redirect to="/app/copilot" />
              </Route>
            </IonRouterOutlet>
            <IonTabBar slot="bottom" style={{
              background: "#ffffff",
              borderTop: "1px solid #e0e0e0",
              "--background": "#ffffff",
              "--color": "#666666",
              "--color-selected": "#0066cc",
            }}>
              <IonTabButton tab="copilot" href="/app/copilot" style={{
                "--color": "#666666",
                "--color-selected": "#0066cc",
              }}>
                <IonIcon icon={chatbubbles} />
                <IonLabel>Live Copilot</IonLabel>
              </IonTabButton>
              <IonTabButton tab="quiz" href="/app/quiz" style={{
                "--color": "#666666",
                "--color-selected": "#0066cc",
              }}>
                <IonIcon icon={school} />
                <IonLabel>Live Quiz</IonLabel>
              </IonTabButton>
            </IonTabBar>
          </IonTabs>
        </Route>
      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
);

export default App;
