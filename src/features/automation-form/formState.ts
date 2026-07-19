/**
 * Stato del form automation: valori iniziali (port di buildForm),
 * regole di visibilità condizionale (port dei getter show*) e
 * validazione completa (port dei Validators con le regole condizionali
 * di setupConditionalFields/applyRequestTypeValidators).
 */

import {
  DATE_RE,
  EMAIL_RE,
  MONTH_YEAR_RE,
  N_CERT_RE,
  PHONE_RE,
  PLZ_RE,
  SERIAL_RE,
  isObviousSerial,
  noPlusEmail,
  violatesMinAgeAtLicense,
  violatesMinAgeFromToday,
} from "./validators";

export interface MainDriverValues {
  gender: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  first_driving_license_date: string;
  zip_code: string;
  canton: string;
  area: string;
  address: string;
  address_number: string;
  nationality: string;
  foreigners_id_type: string;
}

export interface FormValues {
  gender: string;
  company_name: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  first_driving_license_date: string;
  zip_code: string;
  area: string;
  address: string;
  address_number: string;
  email: string;
  phone: string;
  nationality: string;
  foreigners_id_type: string;
  language: string;
  main_driver_type: string;
  main_driver: MainDriverValues;
  deductible_under_26: string;
  n_certificate_1: string;
  car_brand_1: string;
  car_model_1: string;
  serial_number_1: string;
  accessories_1: string | null;
  canton: string;
  license_plate: string;
  first_registration_date_1: string;
  leasing_1: string;
  garage_parking_1: string;
  interchangeable_plate: string;
  vehicle_type_1: string;
  drive_1: string;
  purchase_date_1: string;
  kilometers_per_year_1: string;
  current_mileage_1: string | null;
  reasons_for_redemption_1: string;
  leasing_company_1: string;
  submit_vehicle_proof_1: string;
  n_certificate_2: string;
  car_brand_2: string;
  car_model_2: string;
  accessories_2: string | null;
  serial_number_2: string;
  first_registration_date_2: string;
  leasing_2: string;
  garage_parking_2: string;
  vehicle_type_2: string;
  drive_2: string;
  purchase_date_2: string;
  kilometers_per_year_2: string;
  current_mileage_2: string | null;
  reasons_for_redemption_2: string;
  leasing_company_2: string;
  submit_vehicle_proof_2: string;
  vehicle_usage: string;
  civil_insurance: string;
  comprehensive_insurance: string;
  deductible_total_insurance: string;
  deductible_partial_insurance: string;
  parking_damage_coverage: string;
  deductible_parking_damage: string;
  headlights_mirrors: string;
  personal_belongings_coverage: string;
  tires_damage: string;
  bonus_protection: string;
  roadside_assistance: string;
  garage_free_choice: string;
  passenger_injury: string;
  ev_charging_station: boolean;
  ev_high_voltage_battery: boolean;
  ev_cyber_protection: boolean;
  ev_charging_cards_apps: boolean;
  payment_mode: string;
  current_insurance: string;
  n_rc_claims_5_years: string;
  n_collisions_claims_5_years: string;
  n_parking_claims_5_years: string;
  n_glass_claims_5_years: string;
  n_partial_comprehensive_claims_5_years: string;
  n_rc_claims_3_years: string;
  n_collisions_claims_3_years: string;
  n_parking_claims_3_years: string;
  n_glass_claims_3_years: string;
  n_partial_comprehensive_claims_3_years: string;
  source_user: string;
  other_q_terminated: boolean;
  other_q_refused: boolean;
  other_q_license_suspension: string;
  recipient_email: string;
  scrapers: string[];
  request_type: string;
  registration_scraper: string;
}

export const INITIAL_MAIN_DRIVER: MainDriverValues = {
  gender: "",
  first_name: "",
  last_name: "",
  birth_date: "",
  first_driving_license_date: "",
  zip_code: "",
  canton: "",
  area: "",
  address: "",
  address_number: "",
  nationality: "",
  foreigners_id_type: "",
};

export const INITIAL_VALUES: FormValues = {
  gender: "Male",
  company_name: "",
  first_name: "",
  last_name: "",
  birth_date: "",
  first_driving_license_date: "",
  zip_code: "",
  area: "",
  address: "",
  address_number: "",
  email: "",
  phone: "",
  nationality: "CH",
  foreigners_id_type: "",
  language: "de",
  main_driver_type: "user",
  main_driver: { ...INITIAL_MAIN_DRIVER },
  deductible_under_26: "0",
  n_certificate_1: "",
  car_brand_1: "",
  car_model_1: "",
  serial_number_1: "",
  accessories_1: null,
  canton: "ZH",
  license_plate: "",
  first_registration_date_1: "",
  leasing_1: "No",
  garage_parking_1: "Yes",
  interchangeable_plate: "No",
  vehicle_type_1: "",
  drive_1: "",
  purchase_date_1: "",
  kilometers_per_year_1: "",
  current_mileage_1: null,
  reasons_for_redemption_1: "",
  leasing_company_1: "",
  submit_vehicle_proof_1: "",
  n_certificate_2: "",
  car_brand_2: "",
  car_model_2: "",
  accessories_2: null,
  serial_number_2: "",
  first_registration_date_2: "",
  leasing_2: "No",
  garage_parking_2: "Yes",
  vehicle_type_2: "",
  drive_2: "",
  purchase_date_2: "",
  kilometers_per_year_2: "",
  current_mileage_2: null,
  reasons_for_redemption_2: "",
  leasing_company_2: "",
  submit_vehicle_proof_2: "",
  vehicle_usage: "no_specific_use",
  civil_insurance: "Yes including my property",
  comprehensive_insurance: "Full",
  deductible_total_insurance: "1000",
  deductible_partial_insurance: "0",
  parking_damage_coverage: "No",
  deductible_parking_damage: "",
  headlights_mirrors: "Yes",
  personal_belongings_coverage: "2000",
  tires_damage: "No",
  bonus_protection: "Yes",
  roadside_assistance: "Yes",
  garage_free_choice: "fixed",
  passenger_injury: "No",
  ev_charging_station: false,
  ev_high_voltage_battery: false,
  ev_cyber_protection: false,
  ev_charging_cards_apps: false,
  payment_mode: "Annual",
  current_insurance: "Baloise",
  n_rc_claims_5_years: "0",
  n_collisions_claims_5_years: "0",
  n_parking_claims_5_years: "0",
  n_glass_claims_5_years: "0",
  n_partial_comprehensive_claims_5_years: "0",
  n_rc_claims_3_years: "0",
  n_collisions_claims_3_years: "0",
  n_parking_claims_3_years: "0",
  n_glass_claims_3_years: "0",
  n_partial_comprehensive_claims_3_years: "0",
  source_user: "",
  other_q_terminated: false,
  other_q_refused: false,
  other_q_license_suspension: "none",
  recipient_email: "",
  scrapers: [],
  request_type: "Vergleich Versicherungsangebote",
  registration_scraper: "",
};

// ── Visibilità condizionale (port dei getter) ──────────────────────────────
export const showVehicle2 = (v: FormValues) => v.interchangeable_plate === "Yes";
export const showCompanyName = (v: FormValues) => v.gender === "Company";
export const showForeignersId = (v: FormValues) =>
  !!v.nationality && v.nationality.toUpperCase() !== "CH";
export const showMainDriverForeignersId = (v: FormValues) =>
  !!v.main_driver.nationality && v.main_driver.nationality.toUpperCase() !== "CH";
export const showDeductibleTotal = (v: FormValues) =>
  v.comprehensive_insurance === "Full";
export const showDeductiblePartial = (v: FormValues) =>
  ["Full", "Partial"].includes(v.comprehensive_insurance);
export const showDeductibleParking = (v: FormValues) =>
  v.parking_damage_coverage !== "No";
export const showMainDriverFields = (v: FormValues) => v.main_driver_type === "other";
export const showLeasingCompany1 = (v: FormValues) => v.leasing_1 === "Yes";
export const showLeasingCompany2 = (v: FormValues) => v.leasing_2 === "Yes";
export const isRegistrationOnly = (v: FormValues) =>
  v.request_type === "Nur Nachweis bestellen";
export const isCompareOffers = (v: FormValues) =>
  v.request_type === "Vergleich Versicherungsangebote";
export const isOfferAndRegistration = (v: FormValues) =>
  v.request_type === "Offerte und Nachweis nur von dieser Versicherung";
export const showRegistrationScraper = (v: FormValues) =>
  isRegistrationOnly(v) || isOfferAndRegistration(v);
export const showSubmitVehicleProof = (v: FormValues) => isOfferAndRegistration(v);
export const showScrapersSection = (v: FormValues) => isCompareOffers(v);

// ── Validazione completa ───────────────────────────────────────────────────

export interface AddressValidity {
  plzValid: boolean; // il CAP esiste (cache località)
  areaValid: boolean; // la località appartiene al CAP
  addressValid: boolean; // la via è tra quelle proposte dall'API
}

export type FormErrors = Record<string, string>;

/**
 * Ritorna la mappa campo → codice errore. `addr`/`mdAddr` portano lo stato
 * dei validator asincroni dell'autocomplete (plzExists/areaExists/addressFromApi).
 */
export function validateForm(
  v: FormValues,
  publicMode: boolean,
  addr: AddressValidity,
  mdAddr: AddressValidity,
): FormErrors {
  const e: FormErrors = {};
  const isCompany = v.gender === "Company";

  const req = (field: keyof FormValues, ok: boolean) => {
    if (!ok) e[field] = "required";
  };

  // Dati personali
  req("gender", !!v.gender);
  if (isCompany) {
    req("company_name", !!v.company_name.trim());
  } else {
    req("first_name", !!v.first_name.trim());
    req("last_name", !!v.last_name.trim());
    if (!v.birth_date) e["birth_date"] = "required";
    else if (!DATE_RE.test(v.birth_date)) e["birth_date"] = "pattern";
    else if (violatesMinAgeFromToday(v.birth_date)) e["birth_date"] = "minAge";
    if (!v.first_driving_license_date) e["first_driving_license_date"] = "required";
    else if (!DATE_RE.test(v.first_driving_license_date))
      e["first_driving_license_date"] = "pattern";
    else if (violatesMinAgeAtLicense(v.first_driving_license_date, v.birth_date))
      e["first_driving_license_date"] = "minAge";
  }

  if (!v.zip_code) e["zip_code"] = "required";
  else if (!PLZ_RE.test(v.zip_code)) e["zip_code"] = "pattern";
  else if (!addr.plzValid) e["zip_code"] = "plzNotFound";

  if (!v.area.trim()) e["area"] = "required";
  else if (v.zip_code.length === 4 && !addr.areaValid) e["area"] = "areaNotFound";

  if (!v.address.trim()) e["address"] = "required";
  else if (!addr.addressValid) e["address"] = "addressNotFromApi";

  req("address_number", !!v.address_number.trim());

  if (!v.email) e["email"] = "required";
  else if (!EMAIL_RE.test(v.email)) e["email"] = "email";
  else if (!noPlusEmail(v.email)) e["email"] = "emailPlus";

  if (!v.phone) e["phone"] = "required";
  else if (!PHONE_RE.test(v.phone)) e["phone"] = "pattern";

  req("nationality", !!v.nationality);
  if (showForeignersId(v)) req("foreigners_id_type", !!v.foreigners_id_type);
  req("language", !!v.language);

  // Main driver (solo se 'other')
  if (v.main_driver_type === "other") {
    const md = v.main_driver;
    const mde = (field: string, code: string) => {
      e[`main_driver.${field}`] = code;
    };
    if (!md.gender) mde("gender", "required");
    if (!md.first_name.trim()) mde("first_name", "required");
    if (!md.last_name.trim()) mde("last_name", "required");
    if (!md.birth_date) mde("birth_date", "required");
    else if (!DATE_RE.test(md.birth_date)) mde("birth_date", "pattern");
    else if (violatesMinAgeFromToday(md.birth_date)) mde("birth_date", "minAge");
    if (!md.first_driving_license_date) mde("first_driving_license_date", "required");
    else if (!DATE_RE.test(md.first_driving_license_date))
      mde("first_driving_license_date", "pattern");
    else if (violatesMinAgeAtLicense(md.first_driving_license_date, md.birth_date))
      mde("first_driving_license_date", "minAge");
    if (!md.zip_code) mde("zip_code", "required");
    else if (!PLZ_RE.test(md.zip_code)) mde("zip_code", "pattern");
    else if (!mdAddr.plzValid) mde("zip_code", "plzNotFound");
    if (!md.canton) mde("canton", "required");
    if (!md.area.trim()) mde("area", "required");
    else if (md.zip_code.length === 4 && !mdAddr.areaValid) mde("area", "areaNotFound");
    if (!md.address.trim()) mde("address", "required");
    else if (!mdAddr.addressValid) mde("address", "addressNotFromApi");
    if (!md.address_number.trim()) mde("address_number", "required");
    if (!md.nationality) mde("nationality", "required");
    if (md.nationality && md.nationality.toUpperCase() !== "CH" && !md.foreigners_id_type)
      mde("foreigners_id_type", "required");
  } else {
    // pattern/minAge validano anche se non required (parità)
    const md = v.main_driver;
    if (md.birth_date && !DATE_RE.test(md.birth_date))
      e["main_driver.birth_date"] = "pattern";
    if (md.first_driving_license_date && !DATE_RE.test(md.first_driving_license_date))
      e["main_driver.first_driving_license_date"] = "pattern";
  }

  // Veicolo 1
  if (v.n_certificate_1 && !N_CERT_RE.test(v.n_certificate_1))
    e["n_certificate_1"] = "pattern";
  req("car_brand_1", !!v.car_brand_1.trim());
  req("car_model_1", !!v.car_model_1.trim());
  if (!v.serial_number_1) e["serial_number_1"] = "required";
  else if (!SERIAL_RE.test(v.serial_number_1)) e["serial_number_1"] = "pattern";
  else if (isObviousSerial(v.serial_number_1)) e["serial_number_1"] = "obviousSerial";
  req("canton", !!v.canton);
  if (!v.first_registration_date_1) e["first_registration_date_1"] = "required";
  else if (!DATE_RE.test(v.first_registration_date_1))
    e["first_registration_date_1"] = "pattern";
  req("leasing_1", !!v.leasing_1);
  req("garage_parking_1", !!v.garage_parking_1);
  req("interchangeable_plate", !!v.interchangeable_plate);
  if (v.purchase_date_1 && !MONTH_YEAR_RE.test(v.purchase_date_1))
    e["purchase_date_1"] = "pattern";

  // Veicolo 2 (solo con targhe trasferibili)
  if (showVehicle2(v)) {
    req("car_brand_2", !!v.car_brand_2.trim());
    req("car_model_2", !!v.car_model_2.trim());
    if (!v.serial_number_2) e["serial_number_2"] = "required";
    else if (!SERIAL_RE.test(v.serial_number_2)) e["serial_number_2"] = "pattern";
    else if (isObviousSerial(v.serial_number_2)) e["serial_number_2"] = "obviousSerial";
    if (!v.first_registration_date_2) e["first_registration_date_2"] = "required";
    else if (!DATE_RE.test(v.first_registration_date_2))
      e["first_registration_date_2"] = "pattern";
    req("leasing_2", !!v.leasing_2);
    req("garage_parking_2", !!v.garage_parking_2);
  } else {
    if (v.n_certificate_2 && !N_CERT_RE.test(v.n_certificate_2))
      e["n_certificate_2"] = "pattern";
    if (v.serial_number_2) {
      if (!SERIAL_RE.test(v.serial_number_2)) e["serial_number_2"] = "pattern";
      else if (isObviousSerial(v.serial_number_2)) e["serial_number_2"] = "obviousSerial";
    }
    if (v.first_registration_date_2 && !DATE_RE.test(v.first_registration_date_2))
      e["first_registration_date_2"] = "pattern";
  }
  if (v.purchase_date_2 && !MONTH_YEAR_RE.test(v.purchase_date_2))
    e["purchase_date_2"] = "pattern";

  // Coperture
  req("vehicle_usage", !!v.vehicle_usage);
  req("civil_insurance", !!v.civil_insurance);
  req("comprehensive_insurance", !!v.comprehensive_insurance);
  if (v.comprehensive_insurance === "Full") {
    req("deductible_total_insurance", !!v.deductible_total_insurance);
    req("deductible_partial_insurance", !!v.deductible_partial_insurance);
  } else if (v.comprehensive_insurance === "Partial") {
    req("deductible_partial_insurance", !!v.deductible_partial_insurance);
  }
  if (v.parking_damage_coverage && v.parking_damage_coverage !== "No") {
    req("deductible_parking_damage", !!v.deductible_parking_damage);
  }
  req("headlights_mirrors", !!v.headlights_mirrors);
  req("personal_belongings_coverage", !!v.personal_belongings_coverage);
  req("tires_damage", !!v.tires_damage);
  req("bonus_protection", !!v.bonus_protection);
  req("roadside_assistance", !!v.roadside_assistance);
  req("garage_free_choice", !!v.garage_free_choice);
  req("passenger_injury", !!v.passenger_injury);
  req("payment_mode", !!v.payment_mode);

  // Storico
  req("current_insurance", !!v.current_insurance);
  req("n_rc_claims_5_years", !!v.n_rc_claims_5_years);
  req("n_collisions_claims_5_years", !!v.n_collisions_claims_5_years);
  req("n_parking_claims_5_years", !!v.n_parking_claims_5_years);
  req("n_glass_claims_5_years", !!v.n_glass_claims_5_years);
  req("n_partial_comprehensive_claims_5_years", !!v.n_partial_comprehensive_claims_5_years);

  // Email destinatario (pubblica: required)
  if (publicMode) {
    if (!v.recipient_email) e["recipient_email"] = "required";
    else if (!EMAIL_RE.test(v.recipient_email)) e["recipient_email"] = "email";
    else if (!noPlusEmail(v.recipient_email)) e["recipient_email"] = "emailPlus";
  } else if (v.recipient_email && !noPlusEmail(v.recipient_email)) {
    e["recipient_email"] = "emailPlus";
  }

  // Tipo richiesta (port di applyRequestTypeValidators)
  req("request_type", !!v.request_type);
  if (isRegistrationOnly(v) || isOfferAndRegistration(v)) {
    req("registration_scraper", !!v.registration_scraper);
    if (isOfferAndRegistration(v)) {
      req("submit_vehicle_proof_1", !!v.submit_vehicle_proof_1);
      if (showVehicle2(v)) req("submit_vehicle_proof_2", !!v.submit_vehicle_proof_2);
    }
  } else {
    if (!Array.isArray(v.scrapers) || v.scrapers.length < 1)
      e["scrapers"] = "minArrayLength";
  }

  return e;
}
