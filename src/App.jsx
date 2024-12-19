import { useEffect, useState } from "react";
import axios from "axios";

const App = () => {
  const [n, setN] = useState(null);
  const [sequence, setSequence] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [captchaVisible, setCaptchaVisible] = useState(false); // Pour afficher/masquer le captcha
  const [captchaLoaded, setCaptchaLoaded] = useState(false); // Pour savoir si le script est chargé

  // Charger dynamiquement le script AWS WAF
  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://b82b1763d1c3.eu-west-3.captcha-sdk.awswaf.com/b82b1763d1c3/jsapi.js";
    script.defer = true;

    // Ajouter un gestionnaire d'événements pour le chargement du script
    script.onload = () => {
      console.log("Script AWS WAF chargé avec succès.");
      setCaptchaLoaded(true);
    };

    // Ajouter un gestionnaire d'événements pour les erreurs de chargement
    script.onerror = () => {
      console.error("Échec du chargement du script AWS WAF.");
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script); // Nettoyage du script
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (n === null || n < 1 || n > 1000) {
      alert("Veuillez entrer un nombre entre 1 et 1000.");
      return;
    }

    setSequence([]);
    setIsRunning(true);

    for (let i = 1; i <= n; i++) {
      try {
        const response = await axios.get("https://api.prod.jcloudify.com/whoami");
        setSequence((prev) => [...prev, `${i}. ${response.data || "Forbidden"}`]);
      } catch (error) {
        if (error.response && error.response.status === 403) {
          setCaptchaVisible(true); // Afficher le captcha
          await handleCaptcha(); // Gérer le Captcha
          i--; // Refaire la requête après résolution du Captcha
        } else {
          setSequence((prev) => [...prev, `${i}. Forbidden`]);
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Pause de 1 seconde
    }

    setIsRunning(false);
  };

  const handleCaptcha = () => {
    return new Promise((resolve) => {
      const captchaId = "b82b1763d1c3"; // ID Captcha fourni par AWS WAF
      const captchaCallback = () => {
        resolve(); // Continuer après résolution du Captcha
        setCaptchaVisible(false); // Cacher le captcha après résolution
      };

      // Vérifiez si le script AWS WAF est chargé
      if (captchaLoaded && window.AWSWAF) {
        console.log("Rendu du Captcha.");
        window.AWSWAF.render(captchaId, captchaCallback);
      } else {
        console.error("Le script Captcha AWS WAF n'est pas chargé.");
        resolve(); // Résoudre la promesse même si le script n'est pas disponible
      }
    });
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      {!isRunning ? (
        <form onSubmit={handleSubmit}>
          <label>
            Entrez un nombre (1 à 1000) :
            <input
              type="number"
              min="1"
              max="1000"
              onChange={(e) => setN(Number(e.target.value))}
              required
            />
          </label>
          <button type="submit">Envoyer</button>
        </form>
      ) : (
        <div>
          <h3>Résultat :</h3>
          <ul>
            {sequence.map((line, index) => (
              <li key={index}>{line}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Affichage du captcha si détecté */}
      {captchaVisible && (
        <div>
          <h3>Captcha détecté, veuillez résoudre le captcha pour continuer :</h3>
          <div id="captcha-container"></div>
        </div>
      )}
    </div>
  );
};

export default App;
