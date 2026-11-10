"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/shared/Button";
import { useAuthSession } from "@/lib/experiment/AdaptiveAuthProvider";
import type { ExperimentConsent } from "@/lib/experiment/consent";

type Choice = "yes" | "no" | "";

export function ExperimentConsentForm({
  onAgree,
  onDecline,
}: {
  onAgree: (consent: ExperimentConsent) => void;
  onDecline: () => void;
}) {
  const { user } = useAuthSession();
  const [name, setName] = useState(user?.name?.trim() ?? "");
  const [webcam, setWebcam] = useState<Choice>("");
  const [agree, setAgree] = useState(false);

  useEffect(() => {
    const fromAccount = user?.name?.trim();
    if (!fromAccount) return;
    setName((current) => (current.trim() ? current : fromAccount));
  }, [user?.name]);

  const canSubmit = agree && webcam !== "" && name.trim().length > 1;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          Before you continue
        </p>
        <h1 className="mt-2 text-2xl font-bold text-neutral-900">
          Consent Form
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          German International University (GIU) — master’s thesis study
        </p>

        <div className="mt-5 max-h-[min(28rem,55vh)] space-y-4 overflow-y-auto pr-1 text-sm leading-relaxed text-neutral-700">
          <section>
            <h2 className="font-semibold text-neutral-900">Description</h2>
            <p className="mt-1">
              You are invited to participate in a research study conducted as
              part of a master’s thesis at the German International University
              (GIU). The purpose of this research is to develop and evaluate an
              adaptive e-commerce user interface. The study aims to improve
              usability and user experience, and to evaluate real-time emotion
              recognition using facial expression data collected (with your
              permission) from participants, including Egyptian users. If you
              allow webcam capture, those frames may later be used as a test
              set or for research analysis of the existing emotion-recognition
              model. They are not used to change the model during your
              session.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-neutral-900">Time involvement</h2>
            <p className="mt-1">
              Your participation will take approximately 7–10 minutes.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-neutral-900">Data collection</h2>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>
                Account details used for the study session (name, email, age,
                gender).
              </li>
              <li>
                Questionnaire responses (shopping persona, personality items,
                and self-reported mood).
              </li>
              <li>
                Short webcam facial frames for emotion recognition (only if you
                allow webcam / facial data below).
              </li>
              <li>
                Interface configuration and interaction logs needed to evaluate
                the system.
              </li>
            </ul>
            <p className="mt-2">
              No audio content will be analyzed. Webcam frames, when captured,
              will only be used to extract facial expression information for
              internal research, including later use as a test set to evaluate
              the existing emotion-recognition model. Your face will not be
              published in the master’s thesis, presentations, or papers.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-neutral-900">
              Risks and benefits
            </h2>
            <p className="mt-1">
              There are no known physical or psychological risks associated with
              this study beyond those encountered during normal daily computer
              or smartphone use. The collected data will be stored securely and
              accessed only by the researcher and academic supervisor. Your
              participation will contribute to research on adaptive user
              interfaces and facial emotion recognition for Egyptian users.
            </p>
            <p className="mt-2">
              Your decision whether or not to participate in this study will
              not affect your grade in school. Facial images will not be
              published; results are reported as numbers and summaries only.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-neutral-900">
              Participant’s rights
            </h2>
            <p className="mt-1">
              If you have read this form and have decided to participate in
              this project, please understand your participation is voluntary
              and you have the right to withdraw your consent or discontinue
              participation at any time without penalty or loss of benefits to
              which you are otherwise entitled. The alternative is not to
              participate. You have the right to refuse to answer particular
              questions. The results of this research study may be presented at
              scientific or professional meetings or published in scientific
              journals. Your identity is not disclosed unless we directly
              inform you and ask for your permission.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-neutral-900">
              Contact information
            </h2>
            <p className="mt-1">
              If you have any questions, concerns, or complaints about this
              research, its procedures, risks, and benefits, contact:{" "}
              <a
                className="underline"
                href="mailto:mariam.bashandy@giu-uni.de"
              >
                mariam.bashandy@giu-uni.de
              </a>{" "}
              or{" "}
              <a className="underline" href="mailto:nada.hamed@giu-uni.de">
                nada.hamed@giu-uni.de
              </a>
              .
            </p>
          </section>
        </div>

        <fieldset className="mt-6 space-y-2">
          <legend className="text-sm font-semibold text-neutral-900">
            Webcam / facial expression data (select one)
          </legend>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 p-3 text-sm">
            <input
              type="radio"
              name="webcam-consent"
              checked={webcam === "yes"}
              onChange={() => setWebcam("yes")}
              className="mt-1"
            />
            I allow my webcam facial expression data to be used for this
            research project.
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 p-3 text-sm">
            <input
              type="radio"
              name="webcam-consent"
              checked={webcam === "no"}
              onChange={() => setWebcam("no")}
              className="mt-1"
            />
            I do not allow my webcam facial expression data to be used for this
            research project.
          </label>
        </fieldset>

        <label className="mt-4 block text-sm font-medium text-neutral-900">
          Full name (electronic signature)
          <input
            className="mt-2 w-full rounded-xl border border-neutral-200 p-3 font-normal text-neutral-900"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
          />
        </label>
        <p className="mt-1 text-xs text-neutral-500">
          Typing your name and continuing records your agreement and the date
          automatically.
        </p>

        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 rounded border-neutral-300"
          />
          <span className="text-sm text-neutral-800">
            By continuing I confirm that I have read this form and agree to the
            terms. Participation is voluntary.
          </span>
        </label>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onDecline}
            className="rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-800"
          >
            No thanks — just shop
          </button>
          <Button
            type="button"
            disabled={!canSubmit}
            onClick={() =>
              onAgree({
                agreed: true,
                name: name.trim(),
                webcamFacialAllowed: webcam === "yes",
                publicationImagesAllowed: false,
                consentedAt: new Date().toISOString(),
              })
            }
          >
            I agree — continue
          </Button>
        </div>
      </div>
    </div>
  );
}
