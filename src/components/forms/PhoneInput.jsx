import { useEffect, useState, useMemo } from 'react';
import { Phone, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  PHONE_COUNTRIES,
  getCountryByCode,
  parsePhoneE164,
  buildE164,
  formatNationalDisplay,
  getPhoneValidationResult,
  getBurkinaOperator,
  normalizeNationalDigits,
} from '../../utils/phone';

const PhoneInput = ({
  id = 'phone',
  label = 'Numéro WhatsApp',
  value = '',
  onChange,
  error,
  hint = 'Utilisé pour confirmer votre commande et la livraison',
  required = false,
  className = '',
  showLiveValidation = true,
}) => {
  const parsed = parsePhoneE164(value);
  const [countryCode, setCountryCode] = useState(parsed.countryCode);
  const [nationalDisplay, setNationalDisplay] = useState(() => {
    const country = getCountryByCode(parsed.countryCode);
    return parsed.national ? formatNationalDisplay(parsed.national, country) : '';
  });
  const [touched, setTouched] = useState(false);

  const country = getCountryByCode(countryCode);
  const currentE164 = buildE164(country.dial, nationalDisplay, country);
  const validation = useMemo(
    () => getPhoneValidationResult(currentE164),
    [currentE164]
  );
  const burkinaOperator = useMemo(() => {
    if (countryCode !== 'BF' || validation.status !== 'valid') return null;
    const digits = normalizeNationalDigits(nationalDisplay, country);
    return getBurkinaOperator(digits);
  }, [countryCode, country, nationalDisplay, validation.status]);

  useEffect(() => {
    const next = parsePhoneE164(value);
    setCountryCode(next.countryCode);
    const c = getCountryByCode(next.countryCode);
    setNationalDisplay(next.national ? formatNationalDisplay(next.national, c) : '');
  }, [value]);

  const emitChange = (iso, nationalVal) => {
    const c = getCountryByCode(iso);
    const e164 = buildE164(c.dial, nationalVal, c);
    onChange?.(e164);
  };

  const handleCountryChange = (e) => {
    const iso = e.target.value;
    setCountryCode(iso);
    setTouched(true);
    emitChange(iso, nationalDisplay);
  };

  const handleNationalChange = (e) => {
    const c = getCountryByCode(countryCode);
    const formatted = formatNationalDisplay(e.target.value, c);
    setNationalDisplay(formatted);
    setTouched(true);
    emitChange(countryCode, formatted);
  };

  const showValidation = showLiveValidation && touched && nationalDisplay.length > 0;
  const hasError = Boolean(error) || (showValidation && validation.status === 'invalid');

  const borderClass = hasError
    ? 'border-red-300 focus:border-red-400 focus:ring-red-500/20'
    : showValidation && validation.status === 'valid'
      ? 'border-brand-green focus:border-brand-green focus:ring-brand-green/25'
      : 'border-gray-200 focus:border-brand-green focus:ring-brand-green/25';

  const StatusIcon = () => {
    if (!showValidation) return null;
    if (validation.status === 'valid') {
      return <CheckCircle2 size={18} className="text-brand-green" />;
    }
    if (validation.status === 'invalid') {
      return <AlertCircle size={18} className="text-red-500" />;
    }
    return null;
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-semibold text-gray-700">
          {label}
          {required && <span className="text-brand-orange ml-0.5">*</span>}
        </label>
      )}

      <div className="flex gap-2">
        <div className="relative flex-shrink-0">
          <select
            id={`${id}-country`}
            value={countryCode}
            onChange={handleCountryChange}
            onBlur={() => setTouched(true)}
            aria-label="Indicatif pays"
            className={`h-full min-h-[3.25rem] pl-2.5 pr-7 py-3.5 bg-brand-cream/60 border-2 rounded-xl text-sm font-semibold text-gray-900 appearance-none cursor-pointer focus:outline-none focus:ring-2 transition-all ${borderClass}`}
          >
            {PHONE_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} +{c.dial}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
            ▾
          </span>
        </div>

        <div className="relative flex-1 min-w-0">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Phone size={18} className="text-gray-400" />
          </div>
          <input
            id={id}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            value={nationalDisplay}
            onChange={handleNationalChange}
            onBlur={() => setTouched(true)}
            placeholder={country.placeholder}
            aria-invalid={hasError}
            aria-describedby={`${id}-feedback`}
            className={`w-full pl-11 pr-11 py-3.5 bg-brand-cream/60 border-2 rounded-xl text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 transition-all ${borderClass}`}
          />
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
            <StatusIcon />
          </div>
        </div>
      </div>

      <div id={`${id}-feedback`}>
        {error ? (
          <p className="text-xs text-red-600 flex items-center gap-1.5">
            <AlertCircle size={14} className="flex-shrink-0" />
            {error}
          </p>
        ) : showValidation ? (
          <p
            className={`text-xs flex items-center gap-1.5 ${
              validation.status === 'valid'
                ? 'text-brand-green font-medium'
                : validation.status === 'incomplete'
                  ? 'text-amber-600'
                  : validation.status === 'invalid'
                    ? 'text-red-600'
                    : 'text-gray-400'
            }`}
          >
            {validation.status === 'valid' && <CheckCircle2 size={14} />}
            {validation.status === 'invalid' && <AlertCircle size={14} />}
            {validation.message}
          </p>
        ) : (
          <>
            {country.operatorsHint && (
              <p className="text-[11px] text-gray-400">
                Préfixes mobile {country.name} : {country.operatorsHint}
              </p>
            )}
            {hint && !country.operatorsHint && (
              <p className="text-[11px] text-gray-400">{hint}</p>
            )}
          </>
        )}

        {burkinaOperator && (
          <p className="text-[11px] text-brand-green-dark font-medium mt-0.5">
            Opérateur détecté : {burkinaOperator}
          </p>
        )}

        {currentE164 && (
          <p className="text-[11px] text-gray-500 mt-1">
            Enregistré : <span className="font-mono font-medium text-brand-green-dark">{currentE164}</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default PhoneInput;
