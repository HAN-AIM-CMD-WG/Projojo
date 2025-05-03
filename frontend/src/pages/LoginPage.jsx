import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { notification } from "../components/notifications/NotifySystem";
import { login } from "../services";
import FormInput from "../components/FormInput";
import { useAuth } from "../components/AuthProvider";

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { authData, setAuthData } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [credentials, setCredentials] = useState({
    email: "",
    password: ""
  });

  const error = searchParams.get("error");
  if (error !== null) {
    notification.error(error);
  }

  const handleInputChange = (field) => (value) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError(null);

    try {
      console.log("Logging in with credentials:", credentials);
      const response = await login(credentials);
      console.log("Login successful:", response);
      if (response.status === "success") {
        
        const { role, business, sub } = response.debug_payload;
        console.log("User role:", role);
        if (role === "supervisor") {
          setAuthData({ 
            type: "supervisor", 
            userId: sub, 
            businessId: business, 
            isLoading: false 
          });
        } else if (role === "student") {
          setAuthData({ 
            type: "student", 
            userId: sub, 
            businessId: null, 
            isLoading: false 
          });
        } else if (role === "teacher") {
          setAuthData({ 
            type: "teacher", 
            userId: sub, 
            businessId: null, 
            isLoading: false 
          });
        }
        console.log(authData)
        navigate("/home");
        
        // Store token in localStorage or sessionStorage if needed
        localStorage.setItem("token", response.token);
        localStorage.setItem("payload", response.debug_payload)
        
        notification.success("Succesvol ingelogd");
      } else {
        setFormError("Login mislukt. Controleer uw gegevens.");
      }
    } catch (error) {
      setFormError(error.message || "Er is een fout opgetreden bij het inloggen");
      notification.error(error.message || "Er is een fout opgetreden bij het inloggen");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-dvh flex items-center justify-center p-4">
      <div className="w-sm p-4 sm:p-8 border border-gray-300 rounded-lg shadow-sm">
        <h1 className="mb-4 flex text-center justify-center items-center text-3xl sm:text-4xl font-bold">
          CMD Opdrachtenbox
        </h1>
        <h2 className="mb-4 text-center text-lg font-semibold">
          Login met je account
        </h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormInput
            label="email"
            name="email"
            type="text"
            placeholder="Voer uw gebruikersnaam in"
            required={true}
            initialValue={credentials.email}
            onChange={handleInputChange("email")}
            autocomplete="email"
          />
          
          <FormInput
            label="Wachtwoord"
            name="password"
            type="password"
            placeholder="Voer uw wachtwoord in"
            required={true}
            initialValue={credentials.password}
            onChange={handleInputChange("password")}
            autocomplete="current-password"
          />
          
          {formError && (
            <div className="text-red-500 text-sm mt-2">{formError}</div>
          )}
          
          <button 
            type="submit" 
            className="btn bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md mt-2"
            disabled={isLoading}
          >
            {isLoading ? "Bezig met inloggen..." : "Inloggen"}
          </button>
        </form>
      </div>
    </div>
  );
}
