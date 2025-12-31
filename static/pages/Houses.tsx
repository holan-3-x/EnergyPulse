
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
    Home, Plus, MapPin, Users, Thermometer, Calendar, X,
    Loader2, Trash2, User as UserIcon, Edit2, Search,
    Navigation, Check
} from 'lucide-react';
import { housesService } from '../services/houses';
import { Household } from '../types';
import { useAuth } from '../App';

const Houses: React.FC = () => {
    const [houses, setHouses] = useState<Household[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingHouse, setEditingHouse] = useState<Household | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    // City Search States (OpenStreetMap Integration)
    const [citySearch, setCitySearch] = useState('');
    const [cityResults, setCityResults] = useState<any[]>([]);
    const [searchingCity, setSearchingCity] = useState(false);
    const searchTimeout = useRef<any>(null);

    const [formData, setFormData] = useState({
        houseName: '',
        address: '',
        city: '',
        region: '',
        country: 'Italia',
        members: 2,
        heatingType: 'natural_gas',
        areaSqm: 80,
        yearBuilt: 2000
    });

    const heatingTypes = [
        { value: 'natural_gas', label: 'Natural Gas' },
        { value: 'electric', label: 'Electric' },
        { value: 'heat_pump', label: 'Heat Pump' },
        { value: 'biomass', label: 'Biomass' }
    ];

    useEffect(() => {
        fetchHouses();
    }, []);

    const fetchHouses = async () => {
        try {
            const data = await housesService.getHouses();
            setHouses(data);
        } catch (err) {
            console.error('Failed to fetch houses:', err);
            setError('Failed to load houses');
        } finally {
            setLoading(false);
        }
    };

    // OpenStreetMap Nominatim City Search logic (Open Source & Free)
    const handleCitySearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setCitySearch(value);

        if (searchTimeout.current) clearTimeout(searchTimeout.current);

        if (value.length < 3) {
            setCityResults([]);
            return;
        }

        setSearchingCity(true);
        searchTimeout.current = setTimeout(async () => {
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&countrycodes=it&addressdetails=1&limit=5`);
                const data = await response.json();
                setCityResults(data);
            } catch (err) {
                console.error("City search failed", err);
            } finally {
                setSearchingCity(false);
            }
        }, 600);
    };

    const selectCity = (item: any) => {
        const city = item.address.city || item.address.town || item.address.village || item.display_name.split(',')[0];
        const region = item.address.state || 'Unknown';

        setFormData(prev => ({
            ...prev,
            city: city,
            region: region
        }));
        setCitySearch(city);
        setCityResults([]);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const payload = {
                houseName: formData.houseName,
                address: formData.address,
                city: formData.city,
                region: formData.region,
                country: formData.country,
                members: Number(formData.members),
                heatingType: formData.heatingType as any,
                areaSqm: Number(formData.areaSqm),
                yearBuilt: Number(formData.yearBuilt)
            };

            if (editingHouse) {
                await housesService.updateHouse(editingHouse.id, payload);
            } else {
                await housesService.createHouse(payload);
            }

            await fetchHouses();
            setShowAddForm(false);
            setEditingHouse(null);
            setFormData({
                houseName: '', address: '', city: '', region: '',
                country: 'Italia', members: 2, heatingType: 'natural_gas',
                areaSqm: 80, yearBuilt: 2000
            });
            setCitySearch('');
        } catch (err: any) {
            console.error('Failed to save house:', err);
            setError(err.response?.data?.error || 'Error during saving');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (house: Household) => {
        setEditingHouse(house);
        setFormData({
            houseName: house.houseName,
            address: house.address,
            city: house.city,
            region: house.region,
            country: house.country,
            members: house.members,
            heatingType: house.heatingType,
            areaSqm: house.areaSqm,
            yearBuilt: house.yearBuilt
        });
        setCitySearch(house.city);
        setShowAddForm(true);
    };

    const handleDelete = async (houseId: string) => {
        setError('');
        try {
            await housesService.deleteHouse(houseId);
            // Immediately update local state for instant feedback
            setHouses(prev => prev.filter(h => h.id !== houseId));
        } catch (err: any) {
            console.error('Failed to delete house:', err);
            setError(err.response?.data?.error || 'Failed to archive property. Please try again.');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isAdmin ? 'System Households' : 'My Smart Households'}
                    </h1>
                    <p className="text-gray-500">
                        {isAdmin ? 'Global network overview' : 'Advanced energy monitoring for your properties'}
                    </p>
                </div>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                    <Plus size={18} /> Register New Household
                </button>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 font-medium">
                    {error}
                </div>
            )}

            {showAddForm && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-xl shadow-2xl animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                    <Navigation size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">
                                        {editingHouse ? 'Update Property' : 'Property Registration'}
                                    </h2>
                                    <p className="text-xs text-gray-400">Personalize price simulation inputs</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setShowAddForm(false);
                                    setEditingHouse(null);
                                    setCitySearch('');
                                }}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="col-span-1 md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Household Name</label>
                                    <input
                                        type="text"
                                        name="houseName"
                                        value={formData.houseName}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="e.g. Milan Summer Villa"
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                                    />
                                </div>

                                <div className="col-span-1 md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Street Address</label>
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Physical location for micro-grid simulation"
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                                    />
                                </div>

                                <div className="relative">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">City (Live Search)</label>
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="text"
                                            value={citySearch}
                                            onChange={handleCitySearch}
                                            placeholder="Search city..."
                                            className="w-full pl-11 pr-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                                        />
                                        {searchingCity && (
                                            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-400 animate-spin" size={16} />
                                        )}
                                    </div>

                                    {cityResults.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden z-10 max-h-48 overflow-y-auto">
                                            {cityResults.map((item, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => selectCity(item)}
                                                    className="w-full text-left px-5 py-3 hover:bg-indigo-50 text-sm flex flex-col gap-0.5"
                                                >
                                                    <span className="font-bold text-gray-800">{item.display_name.split(',')[0]}</span>
                                                    <span className="text-[10px] text-gray-400">{item.display_name.split(',').slice(1, 3).join(',')}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Region (Auto-filled)</label>
                                    <input
                                        type="text"
                                        value={formData.region}
                                        readOnly
                                        className="w-full px-5 py-3.5 bg-gray-100 border border-gray-200 rounded-2xl text-gray-500 font-medium cursor-not-allowed"
                                        placeholder="Select city first"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Residents</label>
                                    <div className="relative">
                                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="number"
                                            name="members"
                                            value={formData.members}
                                            onChange={handleInputChange}
                                            min="1"
                                            className="w-full pl-11 pr-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Surface Area (m²)</label>
                                    <input
                                        type="number"
                                        name="areaSqm"
                                        value={formData.areaSqm}
                                        onChange={handleInputChange}
                                        min="10"
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Heating System</label>
                                    <select
                                        name="heatingType"
                                        value={formData.heatingType}
                                        onChange={handleInputChange}
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                    >
                                        {heatingTypes.map(ht => (
                                            <option key={ht.value} value={ht.value}>{ht.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Year of Construction</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="number"
                                            name="yearBuilt"
                                            value={formData.yearBuilt}
                                            onChange={handleInputChange}
                                            min="1800"
                                            max="2025"
                                            className="w-full pl-11 pr-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowAddForm(false)}
                                    className="flex-1 py-4 px-6 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all"
                                >
                                    Dismiss
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting || !formData.city}
                                    className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-indigo-100"
                                >
                                    {submitting ? (
                                        <><Loader2 className="w-5 h-5 animate-spin" /> {editingHouse ? 'Syncing...' : 'Simulating...'}</>
                                    ) : (
                                        <>{editingHouse ? 'Update Node' : 'Initialize Node'}</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Houses Grid */}
            {houses.length === 0 ? (
                <div className="bg-white p-16 rounded-3xl border border-dashed border-gray-200 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Home size={32} className="text-gray-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Register Your First Energy Node</h3>
                    <p className="text-gray-400 mb-8 max-w-sm mx-auto">Registration will enable real-time IoT smart meter data flow for your property.</p>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold inline-flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                    >
                        <Plus size={20} /> Register House
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {houses.map(house => (
                        <div key={house.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden group">
                            {/* Top Accent */}
                            <div className="h-2 bg-indigo-600 w-full" />

                            <div className="p-8">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                                        <Home size={28} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleEdit(house)} className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Edit2 size={18} /></button>
                                        <button onClick={() => handleDelete(house.id)} className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-xl font-bold text-gray-900 line-clamp-1">{house.houseName}</h3>
                                        <Check size={16} className="text-green-500" />
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                                        <MapPin size={12} />
                                        <span>{house.city}, {house.region}</span>
                                    </div>
                                    {isAdmin && (house.ownerName || house.userEmail) && (
                                        <div className="mt-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                                            <div className="flex items-center gap-2 mb-1">
                                                <UserIcon size={12} className="text-indigo-500" />
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Property Owner</span>
                                            </div>
                                            <p className="text-sm font-bold text-indigo-700">{house.ownerName || 'Unknown'}</p>
                                            <p className="text-[11px] text-indigo-500">{house.userEmail || 'No email'}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="bg-gray-50 p-4 rounded-2xl">
                                        <div className="flex items-center gap-2 text-gray-400 mb-1">
                                            <Users size={14} />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">Residents</span>
                                        </div>
                                        <p className="text-sm font-bold text-gray-700">{house.members} people</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-2xl">
                                        <div className="flex items-center gap-2 text-gray-400 mb-1">
                                            <Thermometer size={14} />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">Heat Sys</span>
                                        </div>
                                        <p className="text-sm font-bold text-gray-700 capitalize">{house.heatingType.replace('_', ' ')}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-2xl">
                                        <div className="flex items-center gap-2 text-gray-400 mb-1">
                                            <Calendar size={14} />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">Built</span>
                                        </div>
                                        <p className="text-sm font-bold text-gray-700">{house.yearBuilt}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-2xl">
                                        <div className="flex items-center gap-2 text-indigo-400 mb-1">
                                            <Search size={14} />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">Meter ID</span>
                                        </div>
                                        <p className="text-[10px] font-mono font-bold text-indigo-600 truncate">{house.meterId}</p>
                                    </div>
                                </div>

                                <Link
                                    to={`/houses/${house.id}`}
                                    className="block w-full text-center py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                                >
                                    Access Neural Logs
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Houses;
