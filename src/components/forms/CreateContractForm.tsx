import React, { useState } from 'react'
import { Button } from '../ui/button'

interface CreateContractFormProps {
  onSubmit: (formData: CreateContractFormData) => Promise<void>
  isLoading?: boolean
}

export interface CreateContractFormData {
  fleet: string
  ownerProfile: string
  rate: number
  paymentFreq: 'daily' | 'weekly' | 'monthly'
  maxDuration: number
}

export default function CreateContractForm({ onSubmit, isLoading = false }: CreateContractFormProps) {
  const [formData, setFormData] = useState<CreateContractFormData>({
    fleet: '',
    ownerProfile: '',
    rate: 1000,
    paymentFreq: 'daily',
    maxDuration: 604800
  })

  const [errors, setErrors] = useState<Partial<Record<keyof CreateContractFormData, string>>>({})

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateContractFormData, string>> = {}

    if (!formData.fleet.trim()) {
      newErrors.fleet = 'Fleet address is required'
    }

    if (!formData.ownerProfile.trim()) {
      newErrors.ownerProfile = 'Owner profile is required'
    }

    if (formData.rate < 1) {
      newErrors.rate = 'Rate must be at least 1'
    }

    if (!formData.paymentFreq) {
      newErrors.paymentFreq = 'Payment frequency is required'
    }

    if (formData.maxDuration < 3600) {
      newErrors.maxDuration = 'Maximum duration must be at least 1 hour (3600 seconds)'
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

  const handleInputChange = (field: keyof CreateContractFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Fleet Address */}
        <div className="space-y-2">
          <label htmlFor="fleet" className="text-sm font-medium">
            Fleet Address:
          </label>
          <input
            type="text"
            id="fleet"
            value={formData.fleet}
            onChange={(e) => handleInputChange('fleet', e.target.value)}
            placeholder="Fleet address to rent out"
            className={`w-full px-3 py-2 border rounded-md text-sm ${
              errors.fleet 
                ? 'border-red-500 focus:border-red-500' 
                : 'border-border focus:border-primary'
            } bg-background focus:outline-none focus:ring-2 focus:ring-primary/20`}
            disabled={isLoading}
            required
          />
          {errors.fleet && (
            <p className="text-xs text-red-500">{errors.fleet}</p>
          )}
        </div>

        {/* Owner Profile */}
        <div className="space-y-2">
          <label htmlFor="ownerProfile" className="text-sm font-medium">
            Owner Profile:
          </label>
          <input
            type="text"
            id="ownerProfile"
            value={formData.ownerProfile}
            onChange={(e) => handleInputChange('ownerProfile', e.target.value)}
            placeholder="Your Star Atlas profile"
            className={`w-full px-3 py-2 border rounded-md text-sm ${
              errors.ownerProfile 
                ? 'border-red-500 focus:border-red-500' 
                : 'border-border focus:border-primary'
            } bg-background focus:outline-none focus:ring-2 focus:ring-primary/20`}
            disabled={isLoading}
            required
          />
          {errors.ownerProfile && (
            <p className="text-xs text-red-500">{errors.ownerProfile}</p>
          )}
        </div>

        {/* Rate */}
        <div className="space-y-2">
          <label htmlFor="rate" className="text-sm font-medium">
            Rate (per payment period):
          </label>
          <input
            type="number"
            id="rate"
            value={formData.rate}
            onChange={(e) => handleInputChange('rate', parseInt(e.target.value) || 0)}
            placeholder="1000"
            min="1"
            className={`w-full px-3 py-2 border rounded-md text-sm ${
              errors.rate 
                ? 'border-red-500 focus:border-red-500' 
                : 'border-border focus:border-primary'
            } bg-background focus:outline-none focus:ring-2 focus:ring-primary/20`}
            disabled={isLoading}
            required
          />
          {errors.rate && (
            <p className="text-xs text-red-500">{errors.rate}</p>
          )}
        </div>

        {/* Payment Frequency */}
        <div className="space-y-2">
          <label htmlFor="paymentFreq" className="text-sm font-medium">
            Payment Frequency:
          </label>
          <select
            id="paymentFreq"
            value={formData.paymentFreq}
            onChange={(e) => handleInputChange('paymentFreq', e.target.value as 'daily' | 'weekly' | 'monthly')}
            className={`w-full px-3 py-2 border rounded-md text-sm ${
              errors.paymentFreq 
                ? 'border-red-500 focus:border-red-500' 
                : 'border-border focus:border-primary'
            } bg-background focus:outline-none focus:ring-2 focus:ring-primary/20`}
            disabled={isLoading}
            required
          >
            <option value="">Select frequency</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          {errors.paymentFreq && (
            <p className="text-xs text-red-500">{errors.paymentFreq}</p>
          )}
        </div>
      </div>

      {/* Maximum Duration - Full Width */}
      <div className="space-y-2">
        <label htmlFor="maxDuration" className="text-sm font-medium">
          Maximum Duration (seconds):
        </label>
        <input
          type="number"
          id="maxDuration"
          value={formData.maxDuration}
          onChange={(e) => handleInputChange('maxDuration', parseInt(e.target.value) || 0)}
          placeholder="604800"
          min="3600"
          className={`w-full px-3 py-2 border rounded-md text-sm ${
            errors.maxDuration 
              ? 'border-red-500 focus:border-red-500' 
              : 'border-border focus:border-primary'
          } bg-background focus:outline-none focus:ring-2 focus:ring-primary/20`}
          disabled={isLoading}
          required
        />
        <p className="text-xs text-muted-foreground">
          How long renters can rent for (e.g., 604800 = 1 week)
        </p>
        {errors.maxDuration && (
          <p className="text-xs text-red-500">{errors.maxDuration}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setFormData({
              fleet: '',
              ownerProfile: '',
              rate: 1000,
              paymentFreq: 'daily',
              maxDuration: 604800
            })
            setErrors({})
          }}
          disabled={isLoading}
        >
          Reset
        </Button>
        <Button
          type="submit"
          variant="default"
          loading={isLoading}
          disabled={isLoading}
        >
          {isLoading ? 'Creating...' : '📄 Create Contract'}
        </Button>
      </div>
    </form>
  )
}