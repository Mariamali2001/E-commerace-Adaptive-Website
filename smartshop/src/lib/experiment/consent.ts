export type ExperimentConsent = {
  agreed: boolean;
  name: string;
  webcamFacialAllowed: boolean;
  publicationImagesAllowed: boolean;
  consentedAt: string;
};

export function isWebcamConsentAllowed(
  consent: ExperimentConsent | null | undefined
): boolean {
  if (!consent) return true;
  return consent.webcamFacialAllowed === true;
}
