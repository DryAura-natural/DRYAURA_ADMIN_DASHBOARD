// @ts-nocheck
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
import { useOrign } from "@/hooks/use-origin";
import { zodResolver } from "@hookform/resolvers/zod";
import { Billboard, BillboardImage } from "@prisma/client";
import axios, { AxiosError } from "axios";
import { Trash } from "lucide-react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import ImageUpload from "@/components/ui/image-uplode";

const formSchema = z.object({
  label: z.string().min(1),
  description: z.string().min(1),
  images: z.array(z.string().min(1)).optional(),
});

type BillboardFormValue = z.infer<typeof formSchema>;

interface BillboardFormProps {
  initialData: (Billboard & { images: BillboardImage[] }) | null;
}

export const BillboardForm: React.FC<BillboardFormProps> = ({
  initialData,
}) => {
  const params = useParams();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const title = initialData ? "Edit billboard" : "Create billboard";
  const description = initialData ? "Edit a billboard" : "Add a new billboard";
  const toastMessage = initialData ? "Billboard updated" : "Billboard created";
  const action = initialData ? "Save Changes" : "Create";

  const form = useForm<BillboardFormValue>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData 
      ? {
          label: initialData.label,
          description: initialData.description,
          images: initialData.images ? initialData.images.map((img: any) => img.url) : [],
        }
      : {
          label: "",
          description: "",
          images: [],
        },
  });

  const onSubmit = async (data: BillboardFormValue) => {
    try {
      setLoading(true);
      if (initialData) {
        await axios.patch(
          `/api/${params.storeid}/billboards/${params.billboardId}`,
          data
        );
      } else {
        await axios.post(`/api/${params.storeid}/billboards`, data);
      }

      router.refresh();
      router.push(`/${params.storeid}/billboards`);
      toast.success(toastMessage);
    } catch (error) {
      toast.error("Something went wrong.");
      console.log("this is error ", error);
      
   
    } finally {
      setLoading(false);
    }
  };
  const onDelete = async () => {
  

    try {
      setLoading(true);
      await axios.delete(
        `/api/${params.storeid}/billboards/${params.billboardId}`
      );
      router.refresh();
      router.push("/");
      toast.success("Store deleted");
    } catch (error) {
      toast.error(
        "Make sure you remove all categories using this billboard first"
      );
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
        onConfirm={onDelete}
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
          >
            <Trash className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Separator />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8 w-full"
        >
          <FormField
            control={form.control}
            name="images"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Billboard Images</FormLabel>
                <FormControl>
                  <ImageUpload
                    folderId="67a96d700017b622e519"
                    value={field.value ?? []}
                    disabled={loading}
                    onChange={(url) => 
                      field.onChange([...((field.value || [])), url])
                    }
                    onRemove={(url) => 
                      field.onChange(
                        (field.value || []).filter((current) => current !== url)
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-3 gap-8">
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>label</FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder="Billboard name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder="Billboard description"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button disabled={loading} className="ml-auto" type="submit">
            {action}
          </Button>
        </form>
      </Form>
      <Separator />
    </>
  );
};
