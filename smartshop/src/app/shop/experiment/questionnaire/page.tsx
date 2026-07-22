import { ExperimentQuestionnaire } from "@/components/experiment/ExperimentQuestionnaire";

export const metadata = {
  title: "Experiment questionnaire | SmartShop",
  description: "Short questionnaire before mood detection",
};

export default function ExperimentQuestionnairePage() {
  return (
    <div className="container py-10 md:py-14">
      <ExperimentQuestionnaire />
    </div>
  );
}
