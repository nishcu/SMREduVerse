
'use client';

import { LifeBuoy, Mail } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqItems = [
  {
    question: 'How do I earn Knowledge Coins?',
    answer: 'You can earn Knowledge Coins by completing daily challenges, winning games in the Games Arcade, finishing courses, and participating in platform events and contests.',
  },
  {
    question: 'What can I spend Knowledge Coins on?',
    answer: 'Knowledge Coins can be used to enroll in premium courses, enter contests, generate AI tasks in the Brain Lab, and redeem digital goods from the Rewards Store.',
  },
  {
    question: 'How do I create a course?',
    answer: 'You can create your own course by navigating to the "Courses" page and clicking the "Create Course" button. You will be guided through the process of adding a title, description, chapters, and lessons.',
  },
  {
    question: 'Can I change my username or email?',
    answer: 'Currently, username and email changes must be handled by support. Please use the contact information on this page to request an account information update.',
  },
  {
    question: 'Is there a mobile app?',
    answer: 'A dedicated mobile app for EduVerse Architect is currently in development. In the meantime, the website is fully responsive and can be accessed from any mobile browser.',
  },
];

export default function SupportPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <LifeBuoy className="h-10 w-10 text-primary" />
        <div>
          <h1 className="font-headline text-3xl font-semibold md:text-4xl">
            Support Center
          </h1>
          <p className="text-muted-foreground">
            Have questions? We're here to help.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>
                Find answers to common questions about the platform.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqItems.map((item, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger>{item.question}</AccordionTrigger>
                    <AccordionContent>{item.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
              <CardDescription>
                Can't find an answer? Reach out to our support team.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a
                href="mailto:support@eduverse.com"
                className="flex items-center gap-3 rounded-md bg-secondary p-4 text-secondary-foreground transition-colors hover:bg-secondary/80"
              >
                <Mail className="h-6 w-6" />
                <div className="font-semibold">support@eduverse.com</div>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
