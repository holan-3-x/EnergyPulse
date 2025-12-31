import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Home, Plus, MapPin, Users, Thermometer, Calendar, X, Loader2, Trash2, User as UserIcon, Edit2 } from 'lucide-react';
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

    // Italian cities for dropdown
    const italianCities = [
        'Milano', 'Roma', 'Napoli', 'Torino', 'Firenze', 'Bologna',
        'Genova', 'Palermo', 'Venezia', 'Verona', 'Bari', 'Catania'
    ];

    const italianRegions: Record<string, string> = {
        'Milano': 'Lombardia', 'Roma': 'Lazio', 'Napoli': 'Campania',
        'Torino': 'Piemonte', 'Firenze': 'Toscana', 'Bologna': 'Emilia-Romagna',
        'Genova': 'Liguria', 'Palermo': 'Sicilia', 'Venezia': 'Veneto',
        'Verona': 'Veneto', 'Bari': 'Puglia', 'Catania': 'Sicilia'
    };

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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updated = { ...prev, [name]: value };
            // Auto-fill region when city changes
            if (name === 'city' && italianRegions[value]) {
                updated.region = italianRegions[value];
            }
            return updated;
        });
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

            // Refresh list and close form
            await fetchHouses();
            setShowAddForm(false);
            setEditingHouse(null);
            setFormData({
                houseName: '', address: '', city: '', region: '',
                country: 'Italia', members: 2, heatingType: 'natural_gas',
                areaSqm: 80, yearBuilt: 2000
            });
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
        setShowAddForm(true);
    };

    const handleDelete = async (houseId: string) => {
        if (!confirm('Are you sure you want to delete this house?')) return;

        try {
            await housesService.deleteHouse(houseId);
            await fetchHouses();
        } catch (err) {
            console.error('Failed to delete house:', err);
            setError('Error during deletion');
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
                        {isAdmin ? 'System Households' : 'My Houses'}
                    </h1>
                    <p className="text-gray-500">
                        {isAdmin ? 'Overview of all properties registered in the system' : 'Manage your properties and smart meters'}
                    </p>
                </div>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                >
                    <Plus size={18} /> Add House
                </button>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">
                    {error}
                </div>
            )}

            {/* Add House Form Modal */}
            {showAddForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingHouse ? 'Edit House Details' : 'Add New House'}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowAddForm(false);
                                    setEditingHouse(null);
                                    setFormData({
                                        houseName: '', address: '', city: '', region: '',
                                        country: 'Italia', members: 2, heatingType: 'natural_gas',
                                        areaSqm: 80, yearBuilt: 2000
                                    });
                                }}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">House Name</label>
                                <input
                                    type="text"
                                    name="houseName"
                                    value={formData.houseName}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="e.g. City Apartment"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="e.g. Via Roma 15"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                    <select
                                        name="city"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    >
                                        <option value="">Select...</option>
                                        {italianCities.map(city => (
                                            <option key={city} value={city}>{city}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                                    <input
                                        type="text"
                                        name="region"
                                        value={formData.region}
                                        onChange={handleInputChange}
                                        readOnly
                                        className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Family Members</label>
                                    <input
                                        type="number"
                                        name="members"
                                        value={formData.members}
                                        onChange={handleInputChange}
                                        min="1"
                                        max="10"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Area (m²)</label>
                                    <input
                                        type="number"
                                        name="areaSqm"
                                        value={formData.areaSqm}
                                        onChange={handleInputChange}
                                        min="10"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Heating Type</label>
                                    <select
                                        name="heatingType"
                                        value={formData.heatingType}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    >
                                        {heatingTypes.map(ht => (
                                            <option key={ht.value} value={ht.value}>{ht.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Year Built</label>
                                    <input
                                        type="number"
                                        name="yearBuilt"
                                        value={formData.yearBuilt}
                                        onChange={handleInputChange}
                                        min="1800"
                                        max="2025"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddForm(false)}
                                    className="flex-1 py-3 px-4 border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            {editingHouse ? 'Updating...' : 'Creating...'}
                                        </>
                                    ) : (
                                        editingHouse ? 'Update House' : 'Create House'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Houses Grid */}
            {houses.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center">
                    <Home size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 mb-2">No Houses Registered</h3>
                    <p className="text-gray-500 mb-6">Add your first house to start monitoring consumption.</p>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold inline-flex items-center gap-2 hover:bg-blue-700 transition-all"
                    >
                        <Plus size={18} /> Add First House
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {houses.map(house => (
                        <div key={house.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                                    <Home size={24} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleEdit(house)}
                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                        title="Edit House"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(house.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                        title="Delete House"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 mb-1">{house.houseName}</h3>

                            <div className="space-y-2 text-sm text-gray-500">
                                {isAdmin && house.ownerName && (
                                    <div className="flex items-center gap-2 text-blue-600 font-semibold mb-1">
                                        <UserIcon size={14} />
                                        <span>Owner: {house.ownerName} ({house.userEmail})</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <MapPin size={14} />
                                    <span>{house.address}, {house.city}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users size={14} />
                                    <span>{house.members} members</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Thermometer size={14} />
                                    <span>{house.areaSqm} m² • {house.heatingType}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar size={14} />
                                    <span>Built in {house.yearBuilt}</span>
                                </div>
                            </div>

                            <Link
                                to={`/houses/${house.id}`}
                                className="mt-4 block text-center py-2 bg-gray-50 text-blue-600 font-bold text-sm rounded-xl hover:bg-blue-50 transition-all"
                            >
                                View Details
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Houses;
