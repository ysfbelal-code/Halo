import { HelpCircle } from "lucide-react";
import FAQSection from "../components/help/FAQSection";
import ContactForm from "../components/help/ContactForm";

export default function Help() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-primary" />
          </div>
          <h1 className="font-heading font-bold text-3xl text-foreground">Help Center</h1>
        </div>
        <p className="text-muted-foreground">Find answers to common questions or get in touch</p>
      </div>

      <div className="space-y-6">
        <FAQSection />
        <ContactForm />
      </div>
    </div>
  );
}