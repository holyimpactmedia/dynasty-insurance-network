import { Shield, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface ComplianceBadgeProps {
  isCompliant: boolean
  certUrl?: string
  certId?: string
  warnings?: string[]
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
}

export function ComplianceBadge({
  isCompliant,
  certUrl,
  certId,
  warnings = [],
  size = 'md',
  interactive = false,
}: ComplianceBadgeProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  }

  const textClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }

  const handleViewCert = () => {
    if (certUrl) {
      window.open(certUrl, '_blank')
    }
  }

  return (
    <div
      className={`flex items-center gap-2 ${interactive ? 'cursor-pointer' : ''}`}
      onClick={interactive ? handleViewCert : undefined}
    >
      {isCompliant ? (
        <div className="flex items-center gap-2">
          <div className="relative">
            <CheckCircle2
              className={`${sizeClasses[size]} text-green-600`}
            />
            <Shield
              className="absolute -bottom-1 -right-1 h-3 w-3 text-green-700 bg-white rounded-full"
            />
          </div>
          <div>
            <p className={`${textClasses[size]} font-semibold text-green-700`}>
              TCPA Compliant
            </p>
            {certId && (
              <p className="text-xs text-gray-500">ID: {certId.slice(0, 8)}...</p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <AlertCircle className={`${sizeClasses[size]} text-yellow-600`} />
          <div>
            <p className={`${textClasses[size]} font-semibold text-yellow-700`}>
              Compliance Issue
            </p>
            {warnings.length > 0 && (
              <p className="text-xs text-gray-500">{warnings[0]}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

interface ComplianceDetailsProps {
  data: {
    certId?: string
    certUrl?: string
    claimedAt?: string
    outcome?: string
    isCompliant?: boolean
    browser?: string
    operatingSystem?: string
    expiresAt?: string
    warnings?: string[]
    scanResults?: {
      requiredFound?: string[]
      requiredNotFound?: string[]
      forbiddenFound?: string[]
    }
  }
}

export function ComplianceDetails({ data }: ComplianceDetailsProps) {
  return (
    <Card className="p-4 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">TCPA Compliance Details</h3>
          <ComplianceBadge
            isCompliant={data.isCompliant || false}
            certId={data.certId}
            size="sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-600">Status</p>
            <p className="font-semibold text-slate-900">
              {data.outcome === 'success' ? '✓ Verified' : '⚠ Issue Detected'}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Browser</p>
            <p className="font-semibold text-slate-900 truncate">{data.browser || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-600">OS</p>
            <p className="font-semibold text-slate-900 truncate">
              {data.operatingSystem || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Claimed</p>
            <p className="font-semibold text-slate-900">
              {data.claimedAt
                ? new Date(data.claimedAt).toLocaleDateString()
                : 'Pending'}
            </p>
          </div>
        </div>

        {data.expiresAt && (
          <div className="pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-600">
              Certificate expires:{' '}
              {new Date(data.expiresAt).toLocaleDateString()}
            </p>
          </div>
        )}

        {data.warnings && data.warnings.length > 0 && (
          <div className="pt-2 border-t border-yellow-200 bg-yellow-50 p-2 rounded">
            <p className="text-xs font-semibold text-yellow-800">Warnings:</p>
            <ul className="text-xs text-yellow-700 list-disc pl-4 mt-1">
              {data.warnings.map((warning, idx) => (
                <li key={idx}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        {data.certUrl && (
          <button
            onClick={() => window.open(data.certUrl, '_blank')}
            className="w-full mt-3 px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Full Certificate →
          </button>
        )}
      </div>
    </Card>
  )
}
