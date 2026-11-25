"use client";

import {
  Field as FormischField,
  Form,
  useField,
  useForm,
} from "@formisch/react";
import { CornerDownLeft, ImagePlus, LoaderCircle, Send, X } from "lucide-react";
import type { ChangeEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import * as v from "valibot";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
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
import { PROJECTS } from "@/constants/projects";

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

const CONTACT_PROJECTS = PROJECTS.filter(
  ({ name }) => name !== "skills" && name !== "startercn"
);

const PROJECT_NAMES = Object.fromEntries(
  CONTACT_PROJECTS.map(({ name }) => [name, name])
);

const MAX_LOGO_SIZE = 10_000_000;
const LOGO_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
] as const;

type InquiryType = (typeof INQUIRY_TYPES)[number]["value"];

const getHostname = (value: string) => {
  const trimmed = value.trim();

  if (!trimmed || /\s/u.test(trimmed)) {
    return null;
  }

  if (trimmed.includes("://") && !/^https?:\/\//iu.test(trimmed)) {
    return null;
  }

  try {
    const url = new URL(
      /^https?:\/\//iu.test(trimmed) ? trimmed : `https://${trimmed}`
    );

    return url.username || url.password ? null : url.hostname;
  } catch {
    return null;
  }
};

const getFaviconUrl = (value: string) => {
  const hostname = getHostname(value);

  return hostname
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=128`
    : null;
};

const needsCompany = (inquiryType: string) =>
  inquiryType === "sponsorship" || inquiryType === "partnership";

const LogoSchema = v.pipe(
  v.file(),
  v.mimeType(LOGO_TYPES, "Choose a PNG, JPG, WebP, or SVG image."),
  v.maxSize(MAX_LOGO_SIZE, "Your logo must be 10 MB or smaller.")
);

const ContactSchema = v.pipe(
  v.object({
    _subject: v.pipe(v.string(), v.trim(), v.nonEmpty("Enter a subject.")),
    attachment: v.optional(LogoSchema),
    company_name: v.string(),
    company_website: v.string(),
    email: v.pipe(
      v.string(),
      v.trim(),
      v.email("Enter a valid email address.")
    ),
    inquiry_type: v.picklist(INQUIRY_TYPES.map(({ value }) => value)),
    logo_url: v.string(),
    message: v.pipe(v.string(), v.trim(), v.nonEmpty("Enter a message.")),
    name: v.pipe(v.string(), v.trim(), v.nonEmpty("Enter your name.")),
    no_emails: v.boolean(),
    project: v.string(),
    scope: v.string(),
  }),
  v.forward(
    v.partialCheck(
      [["inquiry_type"], ["scope"], ["project"]],
      (input) =>
        input.inquiry_type !== "sponsorship" ||
        input.scope !== "project" ||
        CONTACT_PROJECTS.some(({ name }) => name === input.project),
      "Select the project you sponsor."
    ),
    ["project"]
  ),
  v.forward(
    v.partialCheck(
      [["inquiry_type"], ["company_website"]],
      (input) =>
        !needsCompany(input.inquiry_type) ||
        Boolean(getHostname(input.company_website)),
      "Enter a valid HTTP or HTTPS website URL."
    ),
    ["company_website"]
  ),
  v.forward(
    v.partialCheck(
      [["inquiry_type"], ["company_name"]],
      (input) =>
        !needsCompany(input.inquiry_type) || Boolean(input.company_name.trim()),
      "Enter your company name."
    ),
    ["company_name"]
  ),
  v.forward(
    v.partialCheck(
      [["inquiry_type"], ["attachment"], ["logo_url"]],
      (input) =>
        !needsCompany(input.inquiry_type) ||
        Boolean(input.attachment || input.logo_url),
      "Upload a company logo or use your website favicon."
    ),
    ["attachment"]
  )
);

/**
 * `inquiry` and `scope` are the raw query values, read on the server so the
 * first render already shows the right fields. Unknown inquiry values fall back
 * to General. `scope=project` is the GitHub Sponsors welcome-message link: the
 * sponsor picks the project their sponsorship covers.
 *
 * Valid website edits debounce for 400 ms, then preload the favicon before
 * replacing the suggested company name and logo. The website-label spinner
 * covers this work; newer edits and manual logo changes discard stale results.
 */
export const ContactForm = ({
  inquiry,
  scope,
}: {
  inquiry?: string | null;
  scope?: string | null;
}) => {
  const defaultInquiryType: InquiryType =
    INQUIRY_TYPES.find(({ value }) => value === inquiry)?.value ?? "general";
  const form = useForm({
    initialInput: {
      _subject:
        defaultInquiryType === "sponsorship" && scope === "project"
          ? "Project sponsorship"
          : "",
      company_name: "",
      company_website: "",
      email: "",
      inquiry_type: defaultInquiryType,
      logo_url: "",
      message: "",
      name: "",
      no_emails: false,
      project: "",
      scope: scope ?? "",
    },
    schema: ContactSchema,
  });
  const inquiryField = useField(form, { path: ["inquiry_type"] });
  const projectStore = useField(form, { path: ["project"] });
  const websiteStore = useField(form, { path: ["company_website"] });
  const companyNameStore = useField(form, { path: ["company_name"] });
  const attachmentStore = useField(form, { path: ["attachment"] });
  const faviconField = useField(form, { path: ["logo_url"] });
  const noEmailsField = useField(form, { path: ["no_emails"] });
  const inquiryType = inquiryField.input ?? defaultInquiryType;
  const isProjectSponsorship =
    inquiryType === "sponsorship" && scope === "project";
  const hasCompanyDetails = needsCompany(inquiryType);
  const website = websiteStore.input ?? "";
  const faviconUrl = faviconField.input || null;
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState("");
  const [isAutofilling, setIsAutofilling] = useState(false);
  const autofillRequest = useRef(0);
  const logoInput = useRef<HTMLInputElement>(null);
  const committedWebsite = useRef("");
  const logoUrl = logoPreview ?? faviconUrl;

  const visibleLogoError = logoError || attachmentStore.errors?.[0] || "";
  useEffect(() => {
    if (!logoPreview) {
      return;
    }

    return () => URL.revokeObjectURL(logoPreview);
  }, [logoPreview]);

  const clearLogo = useCallback(() => {
    autofillRequest.current += 1;
    setIsAutofilling(false);
    faviconField.onChange("");
    attachmentStore.onChange(undefined);
    setLogoPreview(null);
    setLogoError("");
    if (logoInput.current) {
      logoInput.current.value = "";
      logoInput.current.setCustomValidity("");
    }
  }, [attachmentStore, faviconField]);

  useEffect(() => {
    const trimmed = website.trim();
    const hostname = getHostname(trimmed);
    if (!hasCompanyDetails || !hostname) {
      setIsAutofilling(false);
      return;
    }

    const normalized = /^https?:\/\//iu.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    const favicon = getFaviconUrl(normalized);
    if (!favicon || committedWebsite.current === normalized) {
      setIsAutofilling(false);
      return;
    }

    autofillRequest.current += 1;
    const request = autofillRequest.current;
    const image = new Image();
    setIsAutofilling(true);

    const complete = (loaded: boolean) => {
      if (request !== autofillRequest.current) {
        return;
      }

      committedWebsite.current = normalized;
      const [domainName] = hostname.replace(/^www\./iu, "").split(".");
      companyNameStore.onChange(
        domainName
          .replaceAll(/[-_]+/gu, " ")
          .replaceAll(/\b\w/gu, (letter) => letter.toUpperCase())
      );
      clearLogo();
      websiteStore.onChange(normalized);
      if (loaded) {
        faviconField.onChange(favicon);
      } else {
        setLogoError("Favicon unavailable. Please upload a logo.");
      }
    };

    const handleLoad = () => complete(true);
    const handleError = () => complete(false);
    image.addEventListener("load", handleLoad, { once: true });
    image.addEventListener("error", handleError, { once: true });
    const timer = window.setTimeout(() => {
      image.src = favicon;
    }, 400);

    return () => {
      window.clearTimeout(timer);
      image.removeEventListener("load", handleLoad);
      image.removeEventListener("error", handleError);
      image.removeAttribute("src");
      autofillRequest.current += 1;
    };
  }, [
    clearLogo,
    companyNameStore,
    faviconField,
    hasCompanyDetails,
    website,
    websiteStore,
  ]);

  const handleLogoFile = (event: ChangeEvent<HTMLInputElement>) => {
    autofillRequest.current += 1;
    setIsAutofilling(false);
    const input = event.target;
    const file = input.files?.[0];
    attachmentStore.onChange(file);
    const result = v.safeParse(v.optional(LogoSchema), file);
    const error = result.success ? "" : result.issues[0].message;

    input.setCustomValidity(error);
    setLogoError(error);
    faviconField.onChange("");
    setLogoPreview(file && !error ? URL.createObjectURL(file) : null);
  };

  // Override Formisch's JSON-path names on controls to preserve FormSubmit's contract.
  return (
    <Form
      of={form}
      onSubmit={(_, event) => {
        if (isAutofilling) {
          return;
        }
        const element = event.target as HTMLFormElement;
        if (element.reportValidity()) {
          HTMLFormElement.prototype.submit.call(element);
        }
      }}
      action={`https://formsubmit.co/${LINKS.EMAIL}`}
      method="POST"
      encType="multipart/form-data"
      className="pt-2"
    >
      <FieldGroup className="gap-4">
        {scope && <input type="hidden" name="scope" value={scope} />}

        <FormischField of={form} path={["name"]}>
          {(nameField) => (
            <Field data-invalid={nameField.errors !== null}>
              <FieldLabel htmlFor="contact-name">Name</FieldLabel>
              <Input
                {...nameField.props}
                name="name"
                value={nameField.input ?? ""}
                aria-invalid={nameField.errors !== null}
                aria-describedby={
                  nameField.errors ? "contact-name-error" : undefined
                }
                id="contact-name"
                type="text"
                placeholder="John Doe"
                required
              />
              <FieldError id="contact-name-error">
                {nameField.errors?.[0]}
              </FieldError>
            </Field>
          )}
        </FormischField>

        <FormischField of={form} path={["email"]}>
          {(emailField) => (
            <Field data-invalid={emailField.errors !== null}>
              <FieldLabel htmlFor="contact-email">Email</FieldLabel>
              <Input
                {...emailField.props}
                name="email"
                value={emailField.input ?? ""}
                aria-invalid={emailField.errors !== null}
                aria-describedby={
                  emailField.errors ? "contact-email-error" : undefined
                }
                id="contact-email"
                type="email"
                placeholder="john@doe.com"
                required
              />
              <FieldError id="contact-email-error">
                {emailField.errors?.[0]}
              </FieldError>
            </Field>
          )}
        </FormischField>

        <Field data-invalid={inquiryField.errors !== null}>
          <FieldLabel htmlFor="contact-inquiry">Inquiry type</FieldLabel>
          <Select
            name="inquiry_type"
            value={inquiryType}
            onValueChange={(value) => {
              if (value) {
                inquiryField.onChange(value);
                if (value !== "sponsorship") {
                  projectStore.onChange("");
                }
                if (!needsCompany(value)) {
                  clearLogo();
                  websiteStore.onChange("");
                  companyNameStore.onChange("");
                  committedWebsite.current = "";
                }
              }
            }}
            items={INQUIRY_TYPE_LABELS}
          >
            <SelectTrigger
              id="contact-inquiry"
              className="w-full"
              onBlur={inquiryField.props.onBlur}
              onFocus={inquiryField.props.onFocus}
              aria-invalid={inquiryField.errors !== null}
            >
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
          <FieldError>{inquiryField.errors?.[0]}</FieldError>
        </Field>

        {isProjectSponsorship && (
          <FormischField of={form} path={["project"]}>
            {(projectField) => (
              <Field data-invalid={projectField.errors !== null}>
                <FieldLabel htmlFor="contact-project">Project</FieldLabel>
                <Select
                  name="project"
                  value={projectField.input || null}
                  onValueChange={(value) => projectField.onChange(value ?? "")}
                  required
                  items={PROJECT_NAMES}
                >
                  <SelectTrigger
                    id="contact-project"
                    className="w-full"
                    onBlur={projectField.props.onBlur}
                    onFocus={projectField.props.onFocus}
                    aria-invalid={projectField.errors !== null}
                    aria-describedby={
                      projectField.errors ? "contact-project-error" : undefined
                    }
                  >
                    <SelectValue placeholder="Select the project you sponsor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {CONTACT_PROJECTS.map(({ name }) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldError id="contact-project-error">
                  {projectField.errors?.[0]}
                </FieldError>
              </Field>
            )}
          </FormischField>
        )}

        {hasCompanyDetails && (
          <>
            <FormischField of={form} path={["company_website"]}>
              {(websiteField) => (
                <Field data-invalid={websiteField.errors !== null}>
                  <div className="flex items-center justify-between gap-2">
                    <FieldLabel htmlFor="contact-company-website">
                      Company website
                    </FieldLabel>
                    {isAutofilling && (
                      <span role="status">
                        <LoaderCircle
                          className="text-muted-foreground size-4 animate-spin"
                          aria-hidden="true"
                        />
                        <span className="sr-only">
                          Auto-filling company details
                        </span>
                      </span>
                    )}
                  </div>
                  <Input
                    {...websiteField.props}
                    name="company_website"
                    aria-invalid={websiteField.errors !== null}
                    id="contact-company-website"
                    type="text"
                    inputMode="url"
                    aria-describedby={`contact-website-help${websiteField.errors ? " contact-website-error" : ""}`}
                    value={website}
                    placeholder="https://acme.com"
                    required
                  />
                  <FieldDescription
                    id="contact-website-help"
                    className="text-xs"
                  >
                    We auto-fill the company name and logo from the site.
                  </FieldDescription>
                  <FieldError id="contact-website-error">
                    {websiteField.errors?.[0]}
                  </FieldError>
                </Field>
              )}
            </FormischField>

            <FieldGroup className="gap-4">
              <FormischField of={form} path={["company_name"]}>
                {(companyNameField) => (
                  <Field data-invalid={companyNameField.errors !== null}>
                    <FieldLabel htmlFor="contact-company-name">
                      Company name
                    </FieldLabel>
                    <Input
                      {...companyNameField.props}
                      name="company_name"
                      aria-invalid={companyNameField.errors !== null}
                      aria-describedby={
                        companyNameField.errors
                          ? "contact-company-name-error"
                          : undefined
                      }
                      id="contact-company-name"
                      type="text"
                      value={companyNameField.input ?? ""}
                      placeholder="Acme Inc."
                      required
                    />
                    <FieldError id="contact-company-name-error">
                      {companyNameField.errors?.[0]}
                    </FieldError>
                  </Field>
                )}
              </FormischField>

              <FormischField of={form} path={["attachment"]}>
                {(attachmentField) => (
                  <Field data-invalid={Boolean(visibleLogoError)}>
                    <div className="flex flex-col items-start gap-2">
                      <FieldLabel htmlFor="contact-logo">
                        Company logo
                      </FieldLabel>
                      <div className="relative size-20 shrink-0">
                        <input
                          {...attachmentField.props}
                          ref={(element) => {
                            logoInput.current = element;
                            attachmentField.props.ref(element);
                          }}
                          id="contact-logo"
                          type="file"
                          name={faviconUrl ? undefined : "attachment"}
                          accept={LOGO_TYPES.join(",")}
                          onChange={handleLogoFile}
                          required={!logoUrl}
                          aria-invalid={Boolean(visibleLogoError)}
                          aria-describedby={`contact-logo-help${visibleLogoError ? " contact-logo-error" : ""}`}
                          className="peer sr-only"
                        />
                        <label
                          htmlFor="contact-logo"
                          className="border-input bg-muted/30 hover:bg-muted/60 peer-focus-visible:ring-ring flex size-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed peer-focus-visible:ring-2"
                        >
                          {logoUrl ? (
                            <img
                              src={logoUrl}
                              alt="Company logo preview"
                              className="size-full object-contain"
                              onError={() => {
                                clearLogo();
                                setLogoError(
                                  "Logo preview unavailable. Please upload a logo."
                                );
                              }}
                            />
                          ) : (
                            <ImagePlus
                              className="text-muted-foreground size-5"
                              aria-hidden="true"
                            />
                          )}
                        </label>
                        {logoUrl && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            aria-label="Remove company logo"
                            onClick={clearLogo}
                            className="bg-background absolute top-0 right-0 size-6 translate-x-1/2 -translate-y-1/2 rounded-full"
                          >
                            <X className="size-3" aria-hidden="true" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <FieldDescription
                      id="contact-logo-help"
                      className="text-xs"
                    >
                      PNG, JPG, WebP, or SVG. Max 10 MB.
                    </FieldDescription>
                    {visibleLogoError && (
                      <FieldError id="contact-logo-error" className="text-xs">
                        {visibleLogoError}
                      </FieldError>
                    )}
                    <input
                      type="hidden"
                      name="logo_source"
                      value={faviconUrl ? "favicon" : "upload"}
                    />
                    {faviconUrl && (
                      <input type="hidden" name="logo_url" value={faviconUrl} />
                    )}
                  </Field>
                )}
              </FormischField>
            </FieldGroup>
          </>
        )}

        <FormischField of={form} path={["_subject"]}>
          {(subjectField) => (
            <Field data-invalid={subjectField.errors !== null}>
              <FieldLabel htmlFor="contact-subject">Subject</FieldLabel>
              <Input
                {...subjectField.props}
                name="_subject"
                value={subjectField.input ?? ""}
                aria-invalid={subjectField.errors !== null}
                aria-describedby={
                  subjectField.errors ? "contact-subject-error" : undefined
                }
                id="contact-subject"
                type="text"
                placeholder="General: Brief description of your inquiry"
                required
              />
              <FieldError id="contact-subject-error">
                {subjectField.errors?.[0]}
              </FieldError>
            </Field>
          )}
        </FormischField>

        <FormischField of={form} path={["message"]}>
          {(messageField) => (
            <Field data-invalid={messageField.errors !== null}>
              <FieldLabel htmlFor="contact-message">Message</FieldLabel>
              <Textarea
                {...messageField.props}
                name="message"
                value={messageField.input ?? ""}
                aria-invalid={messageField.errors !== null}
                aria-describedby={
                  messageField.errors ? "contact-message-error" : undefined
                }
                id="contact-message"
                placeholder={
                  isProjectSponsorship
                    ? "Placement notes, timing, or anything else we should know."
                    : "Hi, this is my message"
                }
                className="min-h-36"
                required
              />
              <FieldError id="contact-message-error">
                {messageField.errors?.[0]}
              </FieldError>
            </Field>
          )}
        </FormischField>

        <Field orientation="horizontal">
          <Checkbox
            id="contact-no-emails"
            name="no_emails"
            checked={noEmailsField.input ?? false}
            onCheckedChange={noEmailsField.onChange}
            onBlur={noEmailsField.props.onBlur}
            onFocus={noEmailsField.props.onFocus}
            value="yes"
            uncheckedValue="no"
          />
          <FieldLabel
            htmlFor="contact-no-emails"
            className="text-muted-foreground font-normal"
          >
            {"Don't send me emails about Shadcn Labs"}
          </FieldLabel>
        </Field>

        <div className="flex items-center justify-between gap-4">
          <Button type="submit" disabled={isAutofilling}>
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
      </FieldGroup>
    </Form>
  );
};
