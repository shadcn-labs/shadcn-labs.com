"use client";

import { CornerDownLeft, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LINKS } from "@/constants/links";

const INQUIRY_TYPES = [
  { label: "General", value: "general" },
  { label: "Support", value: "support" },
  { label: "Feature request", value: "feature-request" },
  { label: "Bug report", value: "bug-report" },
  { label: "Partnership", value: "partnership" },
  { label: "Sponsorship", value: "sponsorship" },
  { label: "Press", value: "press" },
  { label: "Other", value: "other" },
] as const;

const INQUIRY_TYPE_LABELS = Object.fromEntries(
  INQUIRY_TYPES.map(({ label, value }) => [value, label])
);

const field = "flex flex-col gap-2";

type InquiryType = (typeof INQUIRY_TYPES)[number]["value"];

/**
 * `inquiry` is the raw `?inquiry=` value, read on the server so the first
 * render already shows the right type; unknown values fall back to General.
 */
export const ContactForm = ({ inquiry }: { inquiry?: string | null }) => {
  const defaultInquiryType: InquiryType =
    INQUIRY_TYPES.find(({ value }) => value === inquiry)?.value ?? "general";

  return (
    <form
      action={`https://formsubmit.co/${LINKS.EMAIL}`}
      method="POST"
      className="flex flex-col gap-4 pt-2"
    >
      <div className={field}>
        <Label htmlFor="contact-name">Name</Label>
        <Input
          id="contact-name"
          type="text"
          name="name"
          placeholder="John Doe"
          required
        />
      </div>

      <div className={field}>
        <Label htmlFor="contact-email">Email</Label>
        <Input
          id="contact-email"
          type="email"
          name="email"
          placeholder="john@doe.com"
          required
        />
      </div>

      <div className={field}>
        <Label htmlFor="contact-inquiry">Inquiry type</Label>
        <Select
          name="inquiry_type"
          defaultValue={defaultInquiryType}
          items={INQUIRY_TYPE_LABELS}
        >
          <SelectTrigger id="contact-inquiry" className="w-full">
            <SelectValue placeholder="Select an inquiry type" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {INQUIRY_TYPES.map(({ label, value }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className={field}>
        <Label htmlFor="contact-subject">Subject</Label>
        <Input
          id="contact-subject"
          type="text"
          name="subject"
          placeholder="General: Brief description of your inquiry"
          required
        />
      </div>

      <div className={field}>
        <Label htmlFor="contact-message">Message</Label>
        <Textarea
          id="contact-message"
          name="message"
          placeholder="Hi, this is my message"
          className="min-h-36"
          required
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="contact-no-emails"
          name="no_emails"
          value="yes"
          uncheckedValue="no"
        />
        <Label
          htmlFor="contact-no-emails"
          className="text-muted-foreground font-normal"
        >
          {"Don't send me emails about Shadcn Labs"}
        </Label>
      </div>

      <div className="flex items-center justify-between gap-4">
        <Button type="submit">
          <Send aria-hidden="true" />
          Send message
        </Button>
        <span className="text-muted-foreground inline-flex items-center gap-1 text-sm">
          or
          <Kbd>
            <CornerDownLeft size={14} aria-hidden="true" />
            Enter
          </Kbd>
          to send
        </span>
      </div>
    </form>
  );
};
