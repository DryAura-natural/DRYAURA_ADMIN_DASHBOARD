"use client";
import axios from "axios"
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useStoreModel } from "@/hooks/use-store-model";
import { Model } from "@/components/ui/model";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "../ui/button";
import { useState } from "react";
import toast from "react-hot-toast";

const formSchema = z.object({
  name: z.string().min(1),
});

export const StoreModel = () => {
  const storeModel = useStoreModel();
  const [loading, setLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
  
    try {
      setLoading(true)
      
      const response = await axios.post('/api/stores', values)
      toast.success("Store created successfully.")
      window.location.assign(`/${response.data.id}`)  
      
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        // Handle specific error messages from the backend
        if (error.response.status === 400) {
          toast.error(error.response.data || "A store with this name already exists")
        } else {
          toast.error("Something went wrong.")
        }
      } else {
        toast.error("Something went wrong.")
      }
    } finally {
      setLoading(false)
    }
  };

  return (
    <Model
      title=" Create store"
      description="Add a new store to manage and categories "
      isOpen={storeModel.isOpen}
      onClose={storeModel.onClose}
    >
      <div>
        <div className="space-y-4 py-2 pb-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input disabled={loading} placeholder="E-commerce" {...field} />
                    </FormControl>
                    <FormMessage/>
                  </FormItem>
                )}
              />
              <div className="pt-6 space-x-2 flex item-center justify-end w-full">
                <Button disabled={loading} variant="outline" onClick={storeModel.onClose}>Cancel</Button>
                <Button disabled={loading} type="submit">Continue</Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </Model>
  );
};
