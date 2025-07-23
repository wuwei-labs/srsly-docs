import React, { useState } from 'react'
import { Button } from '../ui/button'

interface AcceptRentalFormProps {
  onSubmit: (formData: AcceptRentalFormData) => Promise<void>
  isLoading?: boolean
}

export interface AcceptRentalFormData {
  contract: string
  profile: string
  faction: 'mud' | 'oni' | 'ustur'
  duration: number
}

export default function AcceptRentalForm({ onSubmit, isLoading = false }: AcceptRentalFormProps) {
  const [formData, setFormData] = useState<AcceptRentalFormData>({
    contract: 'EPyZnehZCztLfsMX4zdxy4vjRpGP8JHyp51ZN6sys4UJ',
    profile: '',
    faction: 'mud',
    duration: 86400
  })

  const [errors, setErrors] = useState<Partial<Record<keyof AcceptRentalFormData, string>>>({})

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof AcceptRentalFormData, string>> = {}

    if (!formData.contract.trim()) {
      newErrors.contract = 'Contract address is required'
    }

    if (!formData.profile.trim()) {
      newErrors.profile = 'Borrower profile is required'
    }

    if (!formData.faction) {
      newErrors.faction = 'Faction selection is required'
    }

    if (formData.duration < 3600) {
      newErrors.duration = 'Duration must be at least 1 hour (3600 seconds)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Form submission failed:', error)
    }
  }

  const handleInputChange = (field: keyof AcceptRentalFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Contract Address */}
        <div className="space-y-2">
          <label htmlFor="contract" className="text-sm font-medium">
            Contract Address:
          </label>
          <input
            type="text"
            id="contract"
            value={formData.contract}
            onChange={(e) => handleInputChange('contract', e.target.value)}
            placeholder="Contract address"
            className={`w-full px-3 py-2 border rounded-md text-sm ${
              errors.contract 
                ? 'border-red-500 focus:border-red-500' 
                : 'border-border focus:border-primary'
            } bg-background focus:outline-none focus:ring-2 focus:ring-primary/20`}
            disabled={isLoading}
            required
          />
          {errors.contract && (
            <p className="text-xs text-red-500">{errors.contract}</p>
          )}
        </div>

        {/* Borrower Profile */}
        <div className="space-y-2">
          <label htmlFor="profile" className="text-sm font-medium">
            Borrower Profile:
          </label>
          <input
            type="text"
            id="profile"
            value={formData.profile}
            onChange={(e) => handleInputChange('profile', e.target.value)}
            placeholder="Your Star Atlas profile address"
            className={`w-full px-3 py-2 border rounded-md text-sm ${
              errors.profile 
                ? 'border-red-500 focus:border-red-500' 
                : 'border-border focus:border-primary'
            } bg-background focus:outline-none focus:ring-2 focus:ring-primary/20`}
            disabled={isLoading}
            required
          />
          {errors.profile && (
            <p className="text-xs text-red-500">{errors.profile}</p>
          )}
        </div>

        {/* Faction */}
        <div className="space-y-2">
          <label htmlFor="faction" className="text-sm font-medium">
            Faction:
          </label>
          <select
            id="faction"
            value={formData.faction}
            onChange={(e) => handleInputChange('faction', e.target.value as 'mud' | 'oni' | 'ustur')}
            className={`w-full px-3 py-2 border rounded-md text-sm ${
              errors.faction 
                ? 'border-red-500 focus:border-red-500' 
                : 'border-border focus:border-primary'
            } bg-background focus:outline-none focus:ring-2 focus:ring-primary/20`}
            disabled={isLoading}
            required
          >
            <option value="">Select Faction</option>
            <option value="mud">MUD</option>
            <option value="oni">ONI</option>
            <option value="ustur">Ustur</option>
          </select>
          {errors.faction && (
            <p className="text-xs text-red-500">{errors.faction}</p>
          )}
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <label htmlFor="duration" className="text-sm font-medium">
            Duration (seconds):
          </label>
          <input
            type="number"
            id="duration"
            value={formData.duration}
            onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 0)}
            placeholder="86400"
            min="3600"
            className={`w-full px-3 py-2 border rounded-md text-sm ${
              errors.duration 
                ? 'border-red-500 focus:border-red-500' 
                : 'border-border focus:border-primary'
            } bg-background focus:outline-none focus:ring-2 focus:ring-primary/20`}
            disabled={isLoading}
            required
          />
          <p className="text-xs text-muted-foreground">
            Default: 86400 (1 day)
          </p>
          {errors.duration && (
            <p className="text-xs text-red-500">{errors.duration}</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setFormData({
              contract: 'EPyZnehZCztLfsMX4zdxy4vjRpGP8JHyp51ZN6sys4UJ',
              profile: '',
              faction: 'mud',
              duration: 86400
            })
            setErrors({})
          }}
          disabled={isLoading}
        >
          Reset
        </Button>
        <Button
          type="submit"
          variant="success"
          loading={isLoading}
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : '✅ Accept Rental'}
        </Button>
      </div>
    </form>
  )
}