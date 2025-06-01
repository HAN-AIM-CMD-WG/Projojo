import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { notification } from "../components/notifications/NotifySystem";
import FormInput from "../components/FormInput";
import { useAuth } from "../components/AuthProvider";
import { API_BASE_URL } from "../services";

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [credentials, setCredentials] = useState({
    email: "",
    password: ""
  });

  // TODO: remove state -> Test-only state for fetching users
  const [testUsers, setTestUsers] = useState([]);
  const [isTestUsersLoading, setIsTestUsersLoading] = useState(false);

  // TODO: remove useEffect -> Fetch test users when component mounts
  useEffect(() => {
    const fetchTestUsers = async () => {
      setIsTestUsersLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}users/`);
        if (response.ok) {
          const data = await response.json();
          setTestUsers(data);
        }
      } catch (error) {
        console.error("Error fetching test users:", error);
      } finally {
        setIsTestUsersLoading(false);
      }
    };

    fetchTestUsers();
  }, []);

  const handleInputChange = (field) => (value) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // TODO: remove handler -> Handle test user selection
  const handleTestUserSelect = (e) => {
    const selectedUserId = e.target.value;
    if (!selectedUserId) return;

    const selectedUser = testUsers.find(user => user.id === selectedUserId);
    if (selectedUser) {
      setCredentials({
        email: selectedUser.email,
        password: selectedUser.password_hash
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError(null);

    try {
      const result = await login(credentials);
      if (result.success) {
        navigate("/home");
      } else {
        setFormError(result.error ? "Ongeldige gebruikersnaam of wachtwoord" : result.error);
      }
    } catch (error) {
      setFormError("Er is een fout opgetreden bij het inloggen");
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

        {/* TODO: remove div -> Testing Section for easy login */}
        <div className="mb-6 p-3 border-2 border-dashed border-orange-400 bg-orange-50 rounded-md">
          <h3 className=" font-bold text-orange-700 mb-2">
            TEST GEBRUIKERS
          </h3>
          <label className="block text-sm font-medium mb-1 text-orange-700">
            Selecteer een testgebruiker:
          </label>
          <select
            className="w-full p-2 border border-orange-300 rounded-md bg-white"
            onChange={handleTestUserSelect}
            disabled={isTestUsersLoading}
          >
            <option value="">-- Selecteer een gebruiker --</option>

            {/* Dynamically create optgroups based on available user types */}
            {[...new Set(testUsers.map(user => user.type))]
              .sort()
              .map(userType => (
                <optgroup key={userType} label={userType.charAt(0).toUpperCase() + userType.slice(1) + "s"}>
                  {testUsers
                    .filter(user => user.type === userType)
                    .map(user => (
                      <option key={user.id} value={user.id}>
                        {user.full_name} - {user.email}
                      </option>
                    ))}
                </optgroup>
              ))
            }
          </select>
          {isTestUsersLoading && <p className="text-xs text-orange-600 mt-1">Gebruikers laden...</p>}
        </div>

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
