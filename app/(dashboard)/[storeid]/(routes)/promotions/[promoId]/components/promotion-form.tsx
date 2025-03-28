"use client";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

const formSchema = z.object({
  code: z.string().min(1, "Promo code is required"),
  discount: z.coerce.number().positive("Discount must be positive"),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  maxUses: z.coerce.number().min(0).optional(),
  maxUsesPerUser: z.coerce.number().min(0).optional(),
  startDate: z.date(),
  endDate: z.date(),
  isActive: z.boolean().default(true),
});

type PromoCodeFormValues = z.infer<typeof formSchema>;

interface PromoCodeFormProps {
  initialData?: any;
}

export const PromoCodeForm: React.FC<PromoCodeFormProps> = ({
  initialData,
}) => {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [openStart, setOpenStart] = useState(false);
  const [openEnd, setOpenEnd] = useState(false);

  const form = useForm<PromoCodeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          discount: parseFloat(initialData.discount),
          startDate: new Date(initialData.startDate),
          endDate: new Date(initialData.endDate),
          maxUses: initialData.maxUses ?? 0,
          maxUsesPerUser: initialData.maxUsesPerUser ?? 0,
        }
      : {
          code: "",
          discount: 0,
          type: "PERCENTAGE",
          startDate: new Date(),
          endDate: new Date(),
          isActive: true,
          maxUses: 0,
          maxUsesPerUser: 0,
        },
  });

  const onSubmit = async (data: PromoCodeFormValues) => {
    try {
      setLoading(true);

      // console.log("Payload: ", payload);
      console.log("Data: ", data);
      const payload = {
        ...data,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate.toISOString(),
      };

 
      if (initialData) {
        await axios.patch(
          `/api/${params.storeid}/promotions/${params.promoId}`,
          payload
        );
      } else {
        await axios.post(`/api/${params.storeid}/promotions`, payload);
      }
    

      

      router.refresh();
      router.push(`/${params.storeid}/promotions`);
      toast.success(
        initialData ? "Promo code updated." : "Promo code created."
      );
    } catch (error) {
      toast.error("Something went wrong. Please check the form data.");
      console.log("this is error " + error);
    } finally {
      setLoading(false);
    }
  };

  const generateRandomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz";
    const code = Array.from({ length: 16 }, () => 
      chars[Math.floor(Math.random() * chars.length)]
    ).join("");
    form.setValue("code", code);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Promo Code</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder="SUMMER24"
                      {...field}
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateRandomCode}
                    disabled={loading}
                  >
                    Generate
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Discount Type</FormLabel>
                <Select
                  disabled={loading}
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                    <SelectItem value="FIXED">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="discount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Discount Value</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    disabled={loading}
                    placeholder="Enter amount"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
                <Popover open={openStart} onOpenChange={setOpenStart}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value
                          ? format(field.value, "MMM dd, yyyy")
                          : "Pick a date"}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      onChange={(date) => {
                        field.onChange(date);
                        setOpenStart(false);
                      }}
                      value={field.value}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date</FormLabel>
                <Popover open={openEnd} onOpenChange={setOpenEnd}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value
                          ? format(field.value, "MMM dd, yyyy")
                          : "Pick a date"}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      onChange={(date) => {
                        field.onChange(date);
                        setOpenEnd(false);
                      }}
                      value={field.value}
                      minDate={form.getValues("startDate")}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maxUses"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Usage Limit (0 = unlimited)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    placeholder="E.g. 100"
                    disabled={loading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maxUsesPerUser"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Per-User Limit (0 = unlimited)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    placeholder="E.g. 3"
                    disabled={loading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={loading} className="ml-auto">
          {loading ? "Processing..." : "Save Changes"}
        </Button>
      </form>
    </Form>
  );
};