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
      <IonTabs>
        <IonRouterOutlet>
          <Route exact path="/copilot">
            <Home />
          </Route>
          <Route exact path="/quiz">
            <InterviewQuiz />
          </Route>
          <Route exact path="/">
            <Redirect to="/copilot" />
          </Route>
        </IonRouterOutlet>
        <IonTabBar slot="bottom" style={{
          background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
          borderTop: "2px solid #667eea",
          "--background": "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
          "--color": "#a8dadc",
          "--color-selected": "#6df76d",
        }}>
          <IonTabButton tab="copilot" href="/copilot" style={{
            "--color": "#a8dadc",
            "--color-selected": "#6df76d",
          }}>
            <IonIcon icon={chatbubbles} />
            <IonLabel>Live Copilot</IonLabel>
          </IonTabButton>
          <IonTabButton tab="quiz" href="/quiz" style={{
            "--color": "#a8dadc",
            "--color-selected": "#6df76d",
          }}>
            <IonIcon icon={school} />
            <IonLabel>Live Quiz</IonLabel>
          </IonTabButton>
        </IonTabBar>
      </IonTabs>
    </IonReactRouter>
  </IonApp>
);

export default App;
