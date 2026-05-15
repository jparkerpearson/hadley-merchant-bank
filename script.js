const header = document.querySelector('.site-header');
const isHome = document.body.classList.contains('home');

if (header) {
  const syncHeader = () => {
    if (!isHome) {
      header.classList.remove('transparent');
      header.classList.add('solid');
      return;
    }
    if (window.scrollY > 12) {
      header.classList.add('solid');
      header.classList.remove('transparent');
    } else {
      header.classList.add('transparent');
      header.classList.remove('solid');
    }
  };

  syncHeader();
  window.addEventListener('scroll', syncHeader, { passive: true });
}

const menuBtn = document.querySelector('.menu-btn');
if (menuBtn && header) {
  menuBtn.addEventListener('click', () => {
    const open = header.classList.toggle('mobile-open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
      }
    });
  },
  { threshold: 0.2 }
);

document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

const buyerIntakeForm = document.querySelector('#buyer-intake-form');

if (buyerIntakeForm) {
  const submitButton = buyerIntakeForm.querySelector('#buyer-intake-submit');
  const statusMessage = buyerIntakeForm.querySelector('#buyer-intake-status');
  const emailInput = buyerIntakeForm.querySelector('#email');
  const preferredContactMethodInput = buyerIntakeForm.querySelector('#preferredContactMethod');
  const textComplianceCopy = buyerIntakeForm.querySelector('#buyer-intake-text-compliance');
  const errorFields = Array.from(buyerIntakeForm.querySelectorAll('[data-error-for]'));
  const getCheckedValues = (fieldName) =>
    Array.from(buyerIntakeForm.querySelectorAll(`input[name="${fieldName}"]:checked`)).map((input) => input.value);

  const syncSubmitState = () => {
    const hasValidEmail = emailInput.value.trim() && emailInput.checkValidity();
    submitButton.disabled = !hasValidEmail;
  };

  const syncTextComplianceCopy = () => {
    if (!textComplianceCopy || !preferredContactMethodInput) {
      return;
    }

    textComplianceCopy.hidden = preferredContactMethodInput.value !== 'Text';
  };

  const setStatus = (message, type) => {
    statusMessage.textContent = message;
    statusMessage.className = `form-status form-status-${type}`;
    statusMessage.hidden = false;
  };

  const clearStatus = () => {
    statusMessage.hidden = true;
    statusMessage.textContent = '';
    statusMessage.className = 'form-status';
  };

  const setFieldError = (fieldName, message = '') => {
    const field = buyerIntakeForm.elements[fieldName];
    const errorNode = buyerIntakeForm.querySelector(`[data-error-for="${fieldName}"]`);
    const group = buyerIntakeForm.querySelector(`.checkbox-group input[name="${fieldName}"]`)?.closest('.checkbox-group');

    if (field && 'length' in field && !field.tagName) {
      Array.from(field).forEach((input) => input.setAttribute('aria-invalid', message ? 'true' : 'false'));
    } else if (field?.setAttribute) {
      field.setAttribute('aria-invalid', message ? 'true' : 'false');
    }

    if (group) {
      group.setAttribute('aria-invalid', message ? 'true' : 'false');
    }

    if (errorNode) {
      errorNode.textContent = message;
      if (message) {
        errorNode.closest('.form-section-collapsible')?.setAttribute('open', '');
      }
    }
  };

  const clearErrors = () => {
    errorFields.forEach((node) => {
      node.textContent = '';
    });

    Array.from(buyerIntakeForm.elements).forEach((field) => {
      if (field instanceof HTMLElement && 'setAttribute' in field) {
        field.setAttribute('aria-invalid', 'false');
      }
    });

    buyerIntakeForm.querySelectorAll('.checkbox-group').forEach((group) => {
      group.setAttribute('aria-invalid', 'false');
    });
  };

  const validateForm = () => {
    clearErrors();
    clearStatus();

    let isValid = true;
    const email = emailInput.value.trim();

    if (!email) {
      setFieldError('email', 'Email is required.');
      isValid = false;
    } else if (!emailInput.checkValidity()) {
      setFieldError('email', 'Enter a valid email address.');
      isValid = false;
    }

    return isValid;
  };

  const resetFormState = () => {
    buyerIntakeForm.reset();
    clearErrors();
    syncSubmitState();
    syncTextComplianceCopy();
  };

  buyerIntakeForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      setStatus('Please correct the highlighted fields and try again.', 'error');
      return;
    }

    const originalLabel = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';

    const fullName = buyerIntakeForm.elements.fullName.value.trim();
    const email = emailInput.value.trim();
    const phone = buyerIntakeForm.elements.phone.value.trim();
    const preferredContactMethod = buyerIntakeForm.elements.preferredContactMethod.value;
    const lookingToAcquire = getCheckedValues('lookingToAcquire');
    const agencyTypePreference = getCheckedValues('agencyTypePreference');
    const agencyStructure = getCheckedValues('agencyStructure');
    const agencySpecialties = getCheckedValues('agencySpecialties');
    const statesOfInterest = buyerIntakeForm.elements.statesOfInterest.value
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    const targetRevenueSize = getCheckedValues('targetRevenueSize');
    const notes = buyerIntakeForm.elements.notes.value.trim();

    try {
      clearStatus();

      const response = await fetch('https://api.glassriverinsure.com/buyer-intake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          preferredContactMethod,
          lookingToAcquire,
          agencyTypePreference,
          agencyStructure,
          agencySpecialties,
          statesOfInterest,
          targetRevenueSize,
          notes,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || 'Submission failed');
      }

      resetFormState();
      setStatus('Thank you. Your buyer intake was submitted successfully.', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Submission failed';
      const friendlyMessage =
        message && message !== 'Submission failed'
          ? `We could not submit the form: ${message}. Please review the details and try again.`
          : 'We could not submit the form right now. Please try again in a moment.';
      setStatus(friendlyMessage, 'error');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = originalLabel;
    }
  });

  emailInput.addEventListener('input', () => {
    if (emailInput.value.trim()) {
      setFieldError('email', emailInput.checkValidity() ? '' : 'Enter a valid email address.');
    } else {
      setFieldError('email', '');
    }
    syncSubmitState();
  });

  buyerIntakeForm.querySelectorAll('select, input, textarea').forEach((field) => {
    field.addEventListener('input', () => {
      if (field.name !== 'email') {
        setFieldError(field.name, '');
      }
      clearStatus();
      if (field.name !== 'email') {
        syncSubmitState();
      }
      if (field.name === 'preferredContactMethod') {
        syncTextComplianceCopy();
      }
    });

    field.addEventListener('change', () => {
      if (field.name !== 'email') {
        setFieldError(field.name, '');
      }
      clearStatus();
      if (field.name !== 'email') {
        syncSubmitState();
      }
      if (field.name === 'preferredContactMethod') {
        syncTextComplianceCopy();
      }
    });
  });

  syncSubmitState();
  syncTextComplianceCopy();
}

const sellerValuationForm = document.querySelector('#seller-valuation-form');

if (sellerValuationForm) {
  const submitButton = sellerValuationForm.querySelector('#seller-valuation-submit');
  const statusMessage = sellerValuationForm.querySelector('#seller-valuation-status');
  const agencyType = sellerValuationForm.querySelector('#agency-type');
  const bookMixField = sellerValuationForm.querySelector('#book-mix-field');
  const bookMixInput = sellerValuationForm.querySelector('#book-mix');
  const rangeInputs = Array.from(sellerValuationForm.querySelectorAll('input[type="range"][data-display-target]'));

  const setStatus = (message, type) => {
    statusMessage.textContent = message;
    statusMessage.className = `form-status form-status-${type}`;
    statusMessage.hidden = false;
  };

  const clearStatus = () => {
    statusMessage.hidden = true;
    statusMessage.textContent = '';
    statusMessage.className = 'form-status';
  };

  const formatCurrency = (value) => {
    const amount = Number(value);

    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(2)}M`;
    }

    return `$${Math.round(amount / 1000)}k`;
  };

  const formatBookMix = (value) => {
    const personal = 100 - Number(value);
    const commercial = Number(value);
    return `${personal}% personal / ${commercial}% commercial`;
  };

  const getScaledRangeValue = (input) => {
    if (input.dataset.scale !== 'log') {
      return Number(input.value);
    }

    const sliderMin = Number(input.min);
    const sliderMax = Number(input.max);
    const rangeMin = Number(input.dataset.minValue);
    const rangeMax = Number(input.dataset.maxValue);
    const normalizedValue = (Number(input.value) - sliderMin) / (sliderMax - sliderMin);
    const scaledValue = rangeMin * (rangeMax / rangeMin) ** normalizedValue;

    return Math.round(scaledValue / 1000) * 1000;
  };

  const syncRangeDisplay = (input) => {
    const targetId = input.dataset.displayTarget;
    const target = targetId ? sellerValuationForm.querySelector(`#${targetId}`) : null;

    if (!target) {
      return;
    }

    if (input.name === 'annualCommissionRevenue') {
      const scaledValue = getScaledRangeValue(input);
      target.textContent = formatCurrency(scaledValue);
      input.setAttribute('aria-valuetext', formatCurrency(scaledValue));
      return;
    }

    if (input.name === 'bookMix') {
      target.textContent = formatBookMix(input.value);
    }
  };

  const syncBookMixVisibility = () => {
    const showBookMix = agencyType.value === 'pc';
    bookMixField.classList.toggle('is-hidden', !showBookMix);
    bookMixInput.disabled = !showBookMix;
  };

  rangeInputs.forEach((input) => {
    syncRangeDisplay(input);
    input.addEventListener('input', () => syncRangeDisplay(input));
    input.addEventListener('change', () => syncRangeDisplay(input));
  });

  agencyType.addEventListener('change', syncBookMixVisibility);
  syncBookMixVisibility();

  sellerValuationForm.addEventListener('submit', (event) => {
    event.preventDefault();
    clearStatus();

    if (!sellerValuationForm.checkValidity()) {
      sellerValuationForm.reportValidity();
      setStatus('Please complete the required fields before requesting a valuation.', 'error');
      return;
    }

    const originalLabel = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';

    const annualCommissionRevenue = getScaledRangeValue(
      sellerValuationForm.elements.annualCommissionRevenue
    );
    const bookMixValue = Number(bookMixInput.value);
    const payload = {
      firstName: sellerValuationForm.elements.firstName.value.trim(),
      lastName: sellerValuationForm.elements.lastName.value.trim(),
      email: sellerValuationForm.elements.email.value.trim(),
      agencyType: sellerValuationForm.elements.agencyType.value,
      agencyState: sellerValuationForm.elements.agencyState.value,
      annualCommissionRevenue,
      bookMix:
        sellerValuationForm.elements.agencyType.value === 'pc'
          ? {
              personalPercentage: 100 - bookMixValue,
              commercialPercentage: bookMixValue,
            }
          : null,
      accountRetention: sellerValuationForm.elements.accountRetention.value,
    };

    fetch('https://api.glassriverinsure.com/seller-valuation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
      .then(async (response) => {
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.error || 'Submission failed');
        }

        setStatus('Thank you. Your valuation request was submitted successfully.', 'success');
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : 'Submission failed';
        const friendlyMessage =
          message && message !== 'Submission failed'
            ? `We could not submit the form: ${message}. Please review the details and try again.`
            : 'We could not submit the form right now. Please try again in a moment.';
        setStatus(friendlyMessage, 'error');
      })
      .finally(() => {
        submitButton.disabled = false;
        submitButton.textContent = originalLabel;
      });
  });

  sellerValuationForm.querySelectorAll('input, select').forEach((field) => {
    field.addEventListener('input', clearStatus);
    field.addEventListener('change', clearStatus);
  });
}
