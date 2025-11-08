import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API, toast } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import countriesJson from '@/data/country_dial_info.json';

const AboutMeForm = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?.id;

  const [form, setForm] = useState({
    user_id: userId || '',
    country: '',
    languages: [],
    about: '',
    social_links: [],
  });

  const [languageInput, setLanguageInput] = useState('');
  const [socialInput, setSocialInput] = useState('');

  useEffect(() => {
    if (!userId) return;
    axios.get(`${API}/about-me/${userId}`)
      .then(res => setForm(res.data))
      .catch(err => {
        if (err.response?.status !== 404) toast.error('Error fetching profile');
      });
  }, [userId]);

  const addLanguage = () => {
    if (!languageInput.trim()) return;
    const lang = languageInput.trim()[0].toUpperCase() + languageInput.trim().slice(1).toLowerCase();
    if (!form.languages.includes(lang)) {
      setForm({ ...form, languages: [...form.languages, lang] });
      setLanguageInput('');
    } else {
      toast.error(`Language "${lang}" already added`);
    }
  };

  const removeLanguage = (lang) => {
    setForm({ ...form, languages: form.languages.filter(l => l !== lang) });
  };

  const addSocialLink = () => {
    if (!socialInput.trim()) return;
    const url = socialInput.trim();
    setForm({ ...form, social_links: [url] });
    setSocialInput('');
  };

  const removeSocialLink = () => {
    setForm({ ...form, social_links: [] });
    setSocialInput('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) return toast.error('User not logged in');

    const payload = {
      user_id: userId,
      about: form.about,
      country: form.country,
      languages: form.languages,
      social_links: form.social_links,
    };

    try {
      await axios.put(`${API}/about-me/${userId}`, payload, { headers: { 'Content-Type': 'application/json' } });
      toast.success('Profile updated!');
    } catch (err) {
      if (err.response?.status === 404) {
        await axios.post(`${API}/about-me/`, payload, { headers: { 'Content-Type': 'application/json' } });
        toast.success('Profile created!');
      } else toast.error('Operation failed');
    }

    navigate('/dashboard');
  };

 return (
  <div
    className="relative min-h-screen flex justify-center items-start py-20 bg-fixed bg-center bg-cover"
    style={{
      backgroundImage:
        "url('https://images.unsplash.com/photo-1504203700686-0bffb09bb7e3?auto=format&fit=crop&w=1800&q=80')", // Photographer working background
    }}
  >
    {/* Subtle dark overlay for readability */}
    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-gray-900/20 to-gray-100/80 backdrop-blur-sm"></div>

    {/* Main Card */}
    <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-lg p-10 border border-gray-100 z-10">
      <h2 className="text-3xl font-bold mb-8 text-center text-gray-900">
        Capture Your Story
      </h2>

      <form className="space-y-8" onSubmit={handleSubmit}>
        {/* About */}
        <div>
          <Label htmlFor="about" className="text-gray-800 font-semibold">
            Your Captured Story
          </Label>
          <Textarea
            id="about"
            rows={5}
            value={form.about}
            onChange={(e) => setForm({ ...form, about: e.target.value })}
            className="mt-2 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="Tell your story as a photographer..."
          />
        </div>

        {/* Country */}
        <div>
          <Label htmlFor="country" className="text-gray-800 font-semibold">
            Country
          </Label>
          <Select
            value={form.country}
            onValueChange={(val) => setForm({ ...form, country: val })}
          >
            <SelectTrigger className="mt-2 w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500">
              <SelectValue placeholder="Select your country" />
            </SelectTrigger>
            <SelectContent className="max-h-[250px] w-[700px] overflow-y-auto border border-gray-200 shadow-lg rounded-lg bg-white">
              {countriesJson.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  <span className="mr-2">{c.emoji}</span>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Languages */}
        <div>
          <Label className="text-gray-800 font-semibold">Languages</Label>
          <div className="flex gap-2 mt-2">
            <Input
              type="text"
              value={languageInput}
              onChange={(e) => setLanguageInput(e.target.value)}
              onKeyPress={(e) =>
                e.key === "Enter" && (e.preventDefault(), addLanguage())
              }
              placeholder="Add a language..."
              className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            />
            <Button
              type="button"
              onClick={addLanguage}
              variant="outline"
              className="text-indigo-600 border-indigo-300 hover:bg-indigo-50"
            >
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {form.languages.map((lang) => (
              <span
                key={lang}
                className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full flex items-center gap-2 text-sm border border-indigo-200"
              >
                {lang}
                <button
                  type="button"
                  onClick={() => removeLanguage(lang)}
                  className="hover:text-indigo-900"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Social Link */}
        <div>
          <Label className="text-gray-800 font-semibold">Social Link</Label>
          <div className="flex gap-2 mt-2">
            <Input
              type="text"
              value={socialInput}
              onChange={(e) => setSocialInput(e.target.value)}
              onKeyPress={(e) =>
                e.key === "Enter" && (e.preventDefault(), addSocialLink())
              }
              placeholder="https://yourprofile.com"
              className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            />
            <Button
              type="button"
              onClick={addSocialLink}
              variant="outline"
              className="text-indigo-600 border-indigo-300 hover:bg-indigo-50"
            >
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {form.social_links.map((url) => (
              <span
                key={url}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full flex items-center gap-2 text-sm border border-blue-200"
              >
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {url}
                </a>
                <button
                  type="button"
                  onClick={removeSocialLink}
                  className="hover:text-blue-900"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-center gap-4 pt-4">
          <Button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6"
          >
            Save
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/dashboard')}
            className="border-gray-300 text-gray-700 hover:bg-gray-100 px-6"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  </div>
);

};

export default AboutMeForm;
