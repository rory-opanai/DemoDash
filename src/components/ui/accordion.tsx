"use client";
import * as AccordionPrimitive from "@radix-ui/react-accordion";

export const Accordion = AccordionPrimitive.Root;
export const AccordionItem = AccordionPrimitive.Item;
export const AccordionTrigger = ({ children, ...props }: any) => (
  <AccordionPrimitive.Header>
    <AccordionPrimitive.Trigger className="w-full text-left py-3 font-medium">{children}</AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
);
export const AccordionContent = ({ children, ...props }: any) => (
  <AccordionPrimitive.Content className="pb-4 pt-1 text-sm">{children}</AccordionPrimitive.Content>
);


