/**
 * Validador e Formatador Inteligente de Número de Celular / WhatsApp
 * Suporta Brasil (DDD + 8 ou 9 dígitos) e Telefones Internacionais
 */

export function formatPhone(value) {
  if (!value) return '';

  const hasPlus = value.trim().startsWith('+');
  const clean = value.replace(/\D/g, '');

  if (!clean) return hasPlus ? '+' : '';

  // Se o número começa com 55 (Brasil) e tem mais de 10 dígitos
  let num = clean;
  let countryPrefix = '';
  
  if (num.startsWith('55') && num.length > 10) {
    countryPrefix = '+55 ';
    num = num.slice(2);
  } else if (hasPlus && num.length > 10) {
    // Número internacional genérico
    return '+' + num.slice(0, 15);
  }

  // Formatação Brasil (DDD) XXXXX-XXXX ou (DDD) XXXX-XXXX
  if (num.length <= 2) {
    return countryPrefix + (num ? `(${num}` : '');
  } else if (num.length <= 6) {
    return countryPrefix + `(${num.slice(0, 2)}) ${num.slice(2)}`;
  } else if (num.length <= 10) {
    return countryPrefix + `(${num.slice(0, 2)}) ${num.slice(2, 6)}-${num.slice(6)}`;
  } else {
    // Celular de 11 dígitos com o 9 na frente
    return countryPrefix + `(${num.slice(0, 2)}) ${num.slice(2, 7)}-${num.slice(7, 11)}`;
  }
}

/**
 * Valida se um número de telefone é verdadeiro e estruturalmente válido
 */
export function validatePhone(phoneStr, isBrazil = true) {
  if (!phoneStr) return false;

  const clean = phoneStr.replace(/\D/g, '');

  // Tratar caso comece com 55
  let digits = clean;
  if (isBrazil && digits.startsWith('55') && digits.length >= 12) {
    digits = digits.slice(2);
  }

  // Rejeitar repetições óbvias (ex: 11111111111, 00000000000, 99999999999)
  if (/^(\d)\1+$/.test(digits)) {
    return false;
  }

  if (isBrazil) {
    // Celular/Fixo no Brasil precisa ter 10 ou 11 dígitos (DDD + 8 ou 9 dígitos)
    if (digits.length !== 10 && digits.length !== 11) {
      return false;
    }

    const ddd = parseInt(digits.slice(0, 2), 10);
    // DDDs válidos no Brasil vão de 11 a 99 (exceto alguns não atribuídos)
    if (ddd < 11 || ddd > 99) {
      return false;
    }

    // Se for celular (11 dígitos), o primeiro dígito após o DDD DEVE ser 9
    if (digits.length === 11) {
      const firstDigitAfterDdd = digits.charAt(2);
      if (firstDigitAfterDdd !== '9') {
        return false;
      }
    }

    return true;
  } else {
    // Internacional: E.164 permite de 8 a 15 dígitos
    return digits.length >= 8 && digits.length <= 15;
  }
}
