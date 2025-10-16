import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import countries from '../data/country_dial_info.json';
import { FaInstagram, FaFacebook, FaLinkedin } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { toast } from '@/App';

const PhotographerProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [profileForm, setProfileForm] = useState({
    full_name: '',
    bio: '',
    specialties: [],
    experience_years: 0,
    phone: '',
    country: 'US',
    location: '',
    profile_image: '',
    cover_image: '',
    socials: { instagram: '', facebook: '', linkedin: '' },
    approval_status: 'pending',
  });

  const [specialtyInput, setSpecialtyInput] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
      fetchProfile();
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`/api/photographer/profile/me`); // replace with your API
      setProfile(response.data);
      setProfileForm({
        full_name: response.data.full_name || '',
        bio: response.data.bio || '',
        specialties: response.data.specialties || [],
        experience_years: response.data.experience_years || 0,
        phone: response.data.phone || '',
        country: response.data.country || 'US',
        location: response.data.location || '',
        profile_image: response.data.profile_image || '',
        cover_image: response.data.cover_image || '',
        socials: response.data.socials || { instagram: '', facebook: '', linkedin: '' },
        approval_status: response.data.approval_status || 'pending',
      });
    } catch (error) {
      console.error('Failed to fetch profile', error);
      setShowForm(true); // show form if profile not found
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (profile) {
        await axios.put(`/api/photographer/profile`, profileForm); // replace with your API
        toast.success('Profile updated successfully!');
      } else {
        await axios.post(`/api/photographer/profile`, profileForm);
        toast.success('Profile created successfully!');
      }
      setShowForm(false);
      fetchProfile();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Profile operation failed');
    } finally {
      setLoading(false);
    }
  };

  const addSpecialty = () => {
    if (specialtyInput.trim() && !profileForm.specialties.includes(specialtyInput.trim())) {
      setProfileForm({ ...profileForm, specialties: [...profileForm.specialties, specialtyInput.trim()] });
      setSpecialtyInput('');
    }
  };

  const removeSpecialty = (specialty) => {
    setProfileForm({ ...profileForm, specialties: profileForm.specialties.filter((s) => s !== specialty) });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">My Profile</h1>
          <Badge className={getStatusColor(profileForm.approval_status)}>
            {profileForm.approval_status.toUpperCase()}
          </Badge>
        </div>

        {/* Profile Display */}
        {!showForm && profile && (
          <div className="space-y-4">
            {profileForm.cover_image && (
              <img src={profileForm.cover_image} alt="Cover" className="w-full h-40 object-cover rounded-lg" />
            )}
            <div className="flex items-center gap-4">
              {profileForm.profile_image && (
                <img src={profileForm.profile_image} alt="Profile" className="w-24 h-24 rounded-full object-cover" />
              )}
              <div>
                <h2 className="text-xl font-bold">{profileForm.full_name}</h2>
                <p className="text-gray-600">{profileForm.location}, {profileForm.country}</p>
                <p className="text-gray-600">Experience: {profileForm.experience_years} years</p>
              </div>
            </div>
            <p className="text-gray-700">{profileForm.bio}</p>

            <div className="flex flex-wrap gap-2">
              {profileForm.specialties.map((s, idx) => (
                <Badge key={idx} variant="secondary">{s}</Badge>
              ))}
            </div>

            <div className="flex items-center gap-4 text-xl">
              {profileForm.socials.instagram && <a href={profileForm.socials.instagram} target="_blank" rel="noreferrer"><FaInstagram className="text-pink-600" /></a>}
              {profileForm.socials.facebook && <a href={profileForm.socials.facebook} target="_blank" rel="noreferrer"><FaFacebook className="text-blue-600" /></a>}
              {profileForm.socials.linkedin && <a href={profileForm.socials.linkedin} target="_blank" rel="noreferrer"><FaLinkedin className="text-blue-800" /></a>}
            </div>

            <Button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white mt-4">
              Edit Profile
            </Button>
          </div>
        )}

        {/* Profile Form */}
        {showForm && (
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Full Name</Label>
                <Input
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                  placeholder="Your full name"
                />
              </div>
              <div className="md:col-span-2">
                <Label>Bio</Label>
                <Textarea
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  placeholder="Tell something about yourself"
                />
              </div>
              <div>
                <Label>Experience (years)</Label>
                <Input
                  type="number"
                  value={profileForm.experience_years}
                  onChange={(e) => setProfileForm({ ...profileForm, experience_years: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Location</Label>
                <Input
                  value={profileForm.location}
                  onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                />
              </div>
              <div>
                <Label>Country</Label>
                <select
                  value={profileForm.country}
                  onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Phone</Label>
                <PhoneInput
                  country={profileForm.country.toLowerCase()}
                  value={profileForm.phone}
                  onChange={(phone) => setProfileForm({ ...profileForm, phone })}
                  inputClass="w-full"
                />
              </div>
              <div>
                <Label>Profile Image URL</Label>
                <Input
                  value={profileForm.profile_image}
                  onChange={(e) => setProfileForm({ ...profileForm, profile_image: e.target.value })}
                  placeholder="Paste image URL"
                />
              </div>
              <div>
                <Label>Cover Image URL</Label>
                <Input
                  value={profileForm.cover_image}
                  onChange={(e) => setProfileForm({ ...profileForm, cover_image: e.target.value })}
                  placeholder="Paste cover image URL"
                />
              </div>
            </div>

            <div>
              <Label>Specialties</Label>
              <div className="flex gap-2">
                <Input
                  value={specialtyInput}
                  onChange={(e) => setSpecialtyInput(e.target.value)}
                  placeholder="Add specialty"
                />
                <Button type="button" onClick={addSpecialty}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {profileForm.specialties.map((s, idx) => (
                  <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                    {s} <button type="button" onClick={() => removeSpecialty(s)}>✕</button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Instagram URL</Label>
                <Input
                  value={profileForm.socials.instagram}
                  onChange={(e) => setProfileForm({ ...profileForm, socials: { ...profileForm.socials, instagram: e.target.value } })}
                />
              </div>
              <div>
                <Label>Facebook URL</Label>
                <Input
                  value={profileForm.socials.facebook}
                  onChange={(e) => setProfileForm({ ...profileForm, socials: { ...profileForm.socials, facebook: e.target.value } })}
                />
              </div>
              <div>
                <Label>LinkedIn URL</Label>
                <Input
                  value={profileForm.socials.linkedin}
                  onChange={(e) => setProfileForm({ ...profileForm, socials: { ...profileForm.socials, linkedin: e.target.value } })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : 'Save Profile'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default PhotographerProfile;
