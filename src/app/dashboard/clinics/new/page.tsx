'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { clinicsApi, FacilityType, FacilityOwnership, LevelOfCare } from '@/lib/clinics';
import { useToast } from '@/components/toast-provider';

export default function NewClinicPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState<{
    name: string;
    facility_code: string;
    facility_type: FacilityType;
    ownership: FacilityOwnership;
    level_of_care: LevelOfCare;
    country: string;
    provides_hiv_services: boolean;
    provides_tb_services: boolean;
    provides_malaria_services: boolean;
    provides_maternal_health: boolean;
    provides_laboratory: boolean;
    provides_pharmacy: boolean;
    address: string;
    phone: string;
    email: string;
    website: string;
    is_active: boolean;
  }>({
    name: '',
    facility_code: '',
    facility_type: 'HealthCenter',
    ownership: 'Government',
    level_of_care: 'Level_1',
    country: 'Nigeria',
    provides_hiv_services: true,
    provides_tb_services: false,
    provides_malaria_services: false,
    provides_maternal_health: false,
    provides_laboratory: false,
    provides_pharmacy: false,
    address: '',
    phone: '',
    email: '',
    website: '',
    is_active: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await clinicsApi.create(formData);
      showSuccess('Clinic created successfully!');
      router.push('/dashboard/clinics');
    } catch (error: any) {
      console.error('Error creating clinic:', error);
      showError(error.response?.data?.error || 'Failed to create clinic');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Add New Clinic
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Create a new healthcare facility
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-6 space-y-6">
        {/* Basic Information */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Facility Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                placeholder="e.g., Main Health Center"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Facility Code *
              </label>
              <input
                type="text"
                name="facility_code"
                value={formData.facility_code}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                placeholder="e.g., MHC001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Facility Type *
              </label>
              <select
                name="facility_type"
                value={formData.facility_type}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
              >
                <option value="Hospital">Hospital</option>
                <option value="HealthCenter">Health Center</option>
                <option value="Clinic">Clinic</option>
                <option value="Dispensary">Dispensary</option>
                <option value="MaternalChildHealthCenter">Maternal & Child Health Center</option>
                <option value="VctCenter">VCT Center</option>
                <option value="LaboratoryOnly">Laboratory Only</option>
                <option value="PharmacyOnly">Pharmacy Only</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ownership *
              </label>
              <select
                name="ownership"
                value={formData.ownership}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
              >
                <option value="Government">Government</option>
                <option value="PrivateForProfit">Private (For Profit)</option>
                <option value="PrivateNotForProfit">Private (Not For Profit)</option>
                <option value="FaithBased">Faith Based</option>
                <option value="Ngo">NGO</option>
                <option value="CommunityBased">Community Based</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Level of Care *
              </label>
              <select
                name="level_of_care"
                value={formData.level_of_care}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
              >
                <option value="Level_1">Level 1 - Community Health</option>
                <option value="Level_2">Level 2 - Dispensary</option>
                <option value="Level_3">Level 3 - Health Center</option>
                <option value="Level_4">Level 4 - Sub-County Hospital</option>
                <option value="Level_5">Level 5 - County Referral Hospital</option>
                <option value="Level_6">Level 6 - National Referral Hospital</option>
              </select>
            </div>
          </div>
        </div>

        {/* Services Provided */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Services Provided
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="provides_hiv_services"
                checked={formData.provides_hiv_services}
                onChange={handleChange}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">HIV Services</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="provides_tb_services"
                checked={formData.provides_tb_services}
                onChange={handleChange}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">TB Services</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="provides_malaria_services"
                checked={formData.provides_malaria_services}
                onChange={handleChange}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Malaria Services</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="provides_maternal_health"
                checked={formData.provides_maternal_health}
                onChange={handleChange}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Maternal Health</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="provides_laboratory"
                checked={formData.provides_laboratory}
                onChange={handleChange}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Laboratory Services</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="provides_pharmacy"
                checked={formData.provides_pharmacy}
                onChange={handleChange}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Pharmacy Services</span>
            </label>
          </div>
        </div>

        {/* Address */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Address
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Full Address
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
              placeholder="e.g., 123 Main Street, Lagos, Nigeria"
            />
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Contact Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                placeholder="e.g., +234-123-456-7890"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                placeholder="e.g., clinic@example.com"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Website (optional)
              </label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                placeholder="e.g., https://clinic.example.com"
              />
            </div>
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Active Clinic
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Clinic'}
          </button>
        </div>
      </form>
    </div>
  );
}
