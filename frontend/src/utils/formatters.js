export function onlyDigits(value = '') {
  return String(value).replace(/\D/g, '');
}

export function formatPhone(value = '') {
  const digits = onlyDigits(value).slice(0, 11);

  if (!digits) {
    return '';
  }

  if (digits.length <= 2) {
    return `(${digits}`;
  }

  const areaCode = digits.slice(0, 2);
  const rest = digits.slice(2);

  if (digits.length <= 6) {
    return `(${areaCode}) ${rest}`;
  }

  if (digits.length <= 10) {
    return `(${areaCode}) ${rest.slice(0, 4)}-${rest.slice(4, 8)}`;
  }

  return `(${areaCode}) ${rest.slice(0, 5)}-${rest.slice(5, 9)}`;
}

export function formatPostalCode(value = '') {
  const digits = onlyDigits(value).slice(0, 8);

  if (!digits) {
    return '';
  }

  if (digits.length <= 5) {
    return digits;
  }

  return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
}

export function formatEstablishmentAddress(establishment = {}) {
  const street = [establishment.logradouro, establishment.numero].filter(Boolean).join(', ');
  const district = [establishment.bairro, establishment.complemento].filter(Boolean).join(' - ');
  const city = [establishment.cidade, establishment.estado].filter(Boolean).join(' / ');
  const postalCode = formatPostalCode(establishment.cep);

  return [street, district, city, postalCode ? `CEP ${postalCode}` : '']
    .filter(Boolean)
    .join(' | ');
}

export function buildPhoneHref(value = '') {
  const digits = onlyDigits(value);
  return digits ? `tel:+55${digits}` : '';
}

export function buildWhatsAppHref(value = '') {
  const digits = onlyDigits(value);

  if (!digits) {
    return '';
  }

  if (digits.startsWith('55')) {
    return `https://wa.me/${digits}`;
  }

  return `https://wa.me/55${digits}`;
}

export function formatCurrencyInput(value = '') {
  const digits = onlyDigits(value);

  if (!digits) {
    return '';
  }

  const amount = Number(digits) / 100;

  return Number.isFinite(amount)
    ? amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : '';
}

export function parseCurrency(value = '') {
  const digits = onlyDigits(value);

  if (!digits) {
    return '';
  }

  return (Number(digits) / 100).toFixed(2);
}

export function formatCurrencyDisplay(value) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return String(value);
  }

  return numberValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatDateBR(value) {
  if (!value) {
    return '-';
  }

  const raw = String(value).slice(0, 10);
  const [year, month, day] = raw.split('-');

  if (!year || !month || !day) {
    return String(value);
  }

  return `${day}/${month}/${year}`;
}

export function parseDateOnlyToLocalDate(value) {
  if (!value) {
    return null;
  }

  const raw = String(value).slice(0, 10);
  const [year, month, day] = raw.split('-').map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

export function formatTimeValue(value) {
  if (!value) {
    return '';
  }

  return String(value).slice(0, 5);
}

export function formatDateTimeBR(date, time) {
  const formattedDate = formatDateBR(date);
  const formattedTime = formatTimeValue(time);

  if (formattedDate === '-' && !formattedTime) {
    return '-';
  }

  return [formattedDate, formattedTime].filter(Boolean).join(' ');
}

export function toDateInputValue(value) {
  if (!value) {
    return '';
  }

  return String(value).slice(0, 10);
}

export function toTimeInputValue(value) {
  return formatTimeValue(value);
}
