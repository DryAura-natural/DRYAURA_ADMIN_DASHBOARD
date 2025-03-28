"use client";

import { z } from "zod";
import { Heading } from "@/components/heading";
import { AlertModal } from "@/components/models/alert-modal";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "@prisma/client";
import axios from "axios";
import { Trash } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

const formSchema = z.object({
  label: z.string().min(1, "Label is required"),
  color: z.string()
    .regex(/^(#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})|)$/, {
      message: 'Must be a valid hex color code or empty',
    })
    .transform(val => val || null)
});

type BadgeFormValue = z.infer<typeof formSchema>;

interface BadgeFormProps {
  initialData: (Omit<Badge, "color"> & { color: string | null }) | null;
}

export const BadgeForm: React.FC<BadgeFormProps> = ({ initialData }) => {
  const params = useParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const title = initialData ? "Edit badge" : "Create badge";
  const description = initialData ? "Edit badge details" : "Add new badge";
  const toastMessage = initialData ? "Badge updated" : "Badge created";
  const action = initialData ? "Save changes" : "Create badge";

  const form = useForm<BadgeFormValue>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? { label: initialData.label, color: initialData.color || "" }
      : { label: "", color: "" }
  });

  const onSubmit = async (data: BadgeFormValue) => {
    try {
      setLoading(true);
      if (initialData) {
        await axios.patch(`/api/${params.storeid}/badges/${params.badgeId}`, data);
      } else {
        await axios.post(`/api/${params.storeid}/badges`, data);
      }
      router.refresh();
      router.push(`/${params.storeid}/badges`);
      toast.success(toastMessage);
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      
      // Check if badge is used in any products
      const productsWithBadge = await axios.get(`/api/${params.storeid}/products?badgeId=${params.badgeId}`);
      
      if (productsWithBadge.data.length > 0) {
        toast.error("Remove this badge from all products before deleting.");
        return;
      }

      await axios.delete(`/api/${params.storeid}/badges/${params.badgeId}`);
      router.refresh();
      router.push(`/${params.storeid}/badges`);
      toast.success("Badge deleted successfully");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data || "Failed to delete badge";
        toast.error(errorMessage);
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={handleDelete}
        loading={loading}
      />

      <div className="flex items-center justify-between">
        <Heading title={title} description={description} />
        {initialData && (
          <Button
            variant="destructive"
            size="icon"
            onClick={() => setOpen(true)}
            disabled={loading}
            aria-label="Delete badge"
          >
            <Trash className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Separator className="my-4" />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Label</FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder="Featured badge"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Accent Color (optional)</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-3">
                      <Input
                        disabled={loading}
                        placeholder="#FFFFFF"
                        className="max-w-[200px]"
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const inputValue = e.target.value;
                          field.onChange(inputValue === '' ? null : inputValue);
                        }}
                        onBlur={field.onBlur}
                        name={field.name}
                      />
                      {field.value && (
                        <div
                          className="h-8 w-8 rounded-full border-2"
                          style={{
                            backgroundColor: field.value,
                            borderColor: field.value,
                          }}
                        />
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={loading}
              className="ml-auto min-w-[150px]"
            >
              {loading ? (
                <span className="animate-pulse">Processing...</span>
              ) : (
                action
              )}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
};