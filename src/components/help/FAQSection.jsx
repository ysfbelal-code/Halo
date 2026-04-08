import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const faqs = [
  {
    question: "What exactly does Guardian block?",
    answer:
      "Guardian uses a comprehensive filtering engine that goes beyond just 'brainrot'. It blocks: (1) Brainrot content like skibidi toilet, fanum tax, and sigma edits. (2) Social engineering and dating content such as blind date challenges and rating videos. (3) High-risk physical stunts and dangerous challenges. (4) Mature-themed reality content including true crime, horror stories, and drama channels.",
  },
  {
    question: "How does the real-time interception work?",
    answer:
      "Guardian scans video metadata, titles, descriptions, and tags using a regex-powered dictionary of 100+ patterns before the content ever renders. If a match is found, the content is intercepted and blocked instantly, so your child sees a 'Content Blocked' message instead of the video starting and then cutting out.",
  },
  {
    question: "What's the difference between Basic, Moderate, and Maximum protection?",
    answer:
      "Basic blocks only high-severity threats across all categories (worst brainrot, dangerous stunts, explicit social engineering). Moderate adds medium-severity patterns, catching more subtle brainrot and mature content. Maximum is the nuclear option — it blocks everything at all severity levels, including low-risk slang and adjacent content.",
  },
  {
    question: "Can I add my own terms to the blocklist?",
    answer:
      "Yes! In Settings → Custom Filters, you can add any keyword or phrase and assign it to a category (Brainrot, Social Engineering, Risky Stunts, etc.). Guardian will block any video that matches your custom terms, including channel names and descriptions.",
  },
  {
    question: "What are the new safety categories?",
    answer:
      "We've expanded beyond brainrot to cover: Social Engineering (dating challenges, relationship advice for kids, rating videos), Risky Stunts (extreme challenges, parkour fails, 'don't try this' content), and Mature Reality (true crime, horror stories, drama channels, and age-inappropriate reality TV).",
  },
  {
    question: "Something slipped through — what do I do?",
    answer:
      "Go to the Report page and submit it. We review every report and add new terms to the global blocklist so they're blocked for everyone. You can track the status of your report there too.",
  },
];

export default function FAQSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-xl">Frequently Asked Questions</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, idx) => (
            <AccordionItem key={idx} value={`item-${idx}`}>
              <AccordionTrigger className="text-left font-medium text-foreground hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
