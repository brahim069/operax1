import { useState, useEffect } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";

function getInitials(first: string, last: string) {
  return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase();
}

function randomColorFromString(str: string) {
  // Simple hash to color
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00FFFFFF)
    .toString(16)
    .toUpperCase();
  return "#" + "00000".substring(0, 6 - c.length) + c;
}

export default function AddManagerPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [managers, setManagers] = useState([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch managers from Supabase
  const fetchManagers = async () => {
    setIsFetching(true);
    const { data, error } = await supabase.from('managers').select('*');
    if (!error) setManagers(data || []);
    setIsFetching(false);
  };

  useEffect(() => {
    fetchManagers();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Duplicate email check
  const emailExists = (email: string) => {
    return managers.some((m: any) => m.email.toLowerCase() === email.toLowerCase());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (emailExists(formData.email)) {
      toast({
        title: "Erreur",
        description: "Cet email existe déjà parmi les chefs.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      // First, create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // Then, create the manager profile
        const { error: profileError } = await supabase
          .from('managers')
          .insert([
            {
              id: authData.user.id,
              first_name: formData.firstName,
              last_name: formData.lastName,
              email: formData.email,
              // role will default to 'admin'
            }
          ]);

        if (profileError) throw profileError;

        toast({
          title: "Manager ajouté",
          description: "Le manager a été ajouté avec succès",
        });

        // Refresh the list
        await fetchManagers();
        setNewlyAddedId(authData.user.id);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 1200);

        // Reset form
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
        });
      }
    } catch (error) {
      console.error('Error adding manager:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout du manager",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Delete manager
  const handleDelete = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce chef ?")) return;
    setDeletingId(id);
    const { error } = await supabase.from('managers').delete().eq('id', id);
    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer ce chef.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Chef supprimé",
        description: "Le chef a été supprimé avec succès.",
      });
      await fetchManagers();
    }
    setDeletingId(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex flex-col">
      <AppHeader />
      <div className="flex flex-1 items-center justify-center py-8">
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Add Chef Form */}
          <div>
            <h1 className="text-3xl font-bold mb-6 text-center text-blue-900">Ajouter un Chef</h1>
            <Card className="shadow-xl border-0">
              <CardHeader>
                <CardTitle>Nouveau Chef</CardTitle>
                <CardDescription>
                  Ajoutez un nouveau chef à l'application
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Prénom</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Nom</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Mot de passe</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      minLength={6}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full flex items-center justify-center"
                    disabled={isLoading}
                  >
                    {isLoading && (
                      <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                      </svg>
                    )}
                    {isLoading ? "Ajout en cours..." : "Ajouter le Chef"}
                  </Button>
                  {showSuccess && (
                    <div className="flex justify-center mt-2">
                      <svg className="h-8 w-8 text-green-500 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>
          {/* List of Chefs */}
          <div>
            <h2 className="text-xl font-bold mb-4 text-blue-900">Liste des Chefs</h2>
            <Card className="shadow-xl border-0 min-h-[300px]">
              <CardContent>
                {isFetching ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <svg className="animate-spin h-8 w-8 text-blue-400 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                    </svg>
                    <span className="text-blue-400">Chargement des chefs...</span>
                  </div>
                ) : managers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    {/* Simple SVG illustration */}
                    <svg width="80" height="80" fill="none" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="40" fill="#e0e7ff" />
                      <rect x="25" y="50" width="30" height="10" rx="5" fill="#a5b4fc" />
                      <circle cx="40" cy="38" r="12" fill="#a5b4fc" />
                    </svg>
                    <div className="text-gray-500 mt-4">Aucun chef pour le moment.<br/>Ajoutez-en un à gauche !</div>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {managers.map((chef) => (
                      <li
                        key={chef.id}
                        className={`p-3 rounded bg-blue-50 flex flex-col md:flex-row md:items-center md:justify-between gap-2 transition-all duration-500 ${newlyAddedId === chef.id ? 'ring-2 ring-green-400 bg-green-50' : ''}`}
                        onAnimationEnd={() => newlyAddedId === chef.id && setNewlyAddedId(null)}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-lg shadow"
                            style={{ background: randomColorFromString(chef.email) }}
                          >
                            {getInitials(chef.first_name, chef.last_name)}
                          </div>
                          <div>
                            <span className="font-semibold">{chef.first_name} {chef.last_name}</span>
                            <span className="block text-sm text-gray-600">{chef.email}</span>
                            <span className="block text-xs text-gray-400">{chef.role}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-2 md:mt-0">
                          {/* Edit button placeholder */}
                          {/* <Button size="sm" variant="outline">Editer</Button> */}
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(chef.id)} disabled={deletingId === chef.id}>
                            {deletingId === chef.id ? "Suppression..." : "Supprimer"}
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 