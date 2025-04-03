"use client";

import { z } from "zod";
import { Prisma } from "@prisma/client";
import { Heading } from "@/components/heading";
import { AlertModal } from "@/components/models/alert-modal";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

import {
  Command,
  CommandInput,
  CommandItem,
  CommandGroup,
} from "@/components/ui/command";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Category,
  Color,
  Image,
  Product,
  ProductVariant,
  Size,
} from "@prisma/client";
import axios from "axios";
import { CheckIcon, Trash, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import ImageUpload from "@/components/ui/image-uplode";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch"; // Import Switch component
import { v4 as uuidv4 } from "uuid";

const formSchema = z.object({
  name: z.string().min(1),
  images: z.array(z.object({ url: z.string() })),
  categoryIds: z.array(z.string().min(1)),
  variants: z.array(
    z.object({
      id: z.string(),
      sizeId: z.string().min(1),
      colorId: z.string().optional().nullable(),
      price: z.coerce.number().min(1),
      mrp: z.coerce.number().min(1),
    })
  ),
  badgeIds: z.array(z.string()).optional(),
  productBanners: z.array(z.object({ url: z.string() })).optional(),
  description: z.string().optional(),
  subLabel: z.string().optional(),
  benefits: z.array(z.string()).optional(),
  specifications: z.array(z.string()).optional(),
  isOutOfStock: z.boolean().optional(), // Add isOutOfStock field to schema
});

interface Variant {
  id: string;
  sizeId: string;
  price: number;
  mrp: number;
  colorId?: string | null;
}

type ProductFormValues = z.infer<typeof formSchema>;

interface ProductFormProps {
  initialData:
    | (Product & {
        images: Image[];
        variants: ProductVariant[];
        categories: { categoryId: string }[];
        badges: { badgeId: string }[];
        productBanner: Image[];
      })
    | null;
  categories: Category[];
  colors: Color[];
  sizes: Size[];
  badges: { id: string; label: string }[];
}

// Utility function to parse and normalize benefits/specifications input
const parseJsonOrText = (
  input: string | undefined
): Record<string, any> | undefined => {
  if (!input) return undefined;

  // Trim and remove extra whitespaces
  const trimmedInput = input.trim();

  // Try parsing as JSON first
  try {
    const parsedJson = JSON.parse(trimmedInput);
    return parsedJson;
  } catch {
    // If not valid JSON, create a structured object
    // Split by newlines, remove empty lines
    const lines = trimmedInput
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => line.trim());

    // If it looks like a list of benefits/specs
    if (lines.length > 0) {
      return {
        description: lines.length === 1 ? lines[0] : undefined,
        items: lines.length > 1 ? lines : undefined,
      };
    }

    // Fallback to empty object if no meaningful input
    return undefined;
  }
};

const MultiSelectInput = ({
  value,
  onChange,
  placeholder,
  disabled,
}: {
  value: string[];
  onChange: (newValue: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}) => {
  const [inputValue, setInputValue] = useState("");

  const handleAddItem = () => {
    if (inputValue.trim() && !value.includes(inputValue.trim())) {
      onChange([...value, inputValue.trim()]);
      setInputValue("");
    }
  };

  const handleRemoveItem = (itemToRemove: string) => {
    onChange(value.filter((item) => item !== itemToRemove));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map((item) => (
          <div
            key={item}
            className="flex items-center bg-gray-100 rounded-md px-2 py-1 text-sm"
          >
            {item}
            <button
              type="button"
              onClick={() => handleRemoveItem(item)}
              className="ml-2 text-red-500 hover:text-red-700"
              disabled={disabled}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddItem();
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-grow"
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleAddItem}
          disabled={disabled || !inputValue.trim()}
          className="ml-2"
        >
          Add
        </Button>
      </div>
    </div>
  );
};

export const ProductForm: React.FC<ProductFormProps> = ({
  initialData,
  categories,
  colors,
  sizes,
  badges,
}) => {
  const params = useParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const title = initialData ? "Edit product" : "Create product";
  const description = initialData ? "Edit a product" : "Add a new product";
  const toastMessage = initialData ? "Product updated" : "Product created";
  const action = initialData ? "Save Changes" : "Create";

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          description: initialData.description || undefined,
          subLabel: initialData.subLabel || undefined,
          images: initialData.images.map((img) => ({ url: img.url })),
          categoryIds: initialData.categories.map((c) => c.categoryId),
          variants: initialData.variants.map((v) => ({
            id: v.id,
            sizeId: v.sizeId,
            colorId: v.colorId || null,
            price: parseFloat(String(v.price)),
            mrp: parseFloat(String(v.mrp)),
          })),
          badgeIds: initialData.badges.map((b) => b.badgeId),
          productBanners: initialData.productBanner.map((b) => ({
            url: b.url,
          })),
          benefits: Array.isArray(initialData.benefits)
            ? initialData.benefits
            : typeof initialData.benefits === "string"
            ? [initialData.benefits]
            : initialData.benefits
            ? Object.values(initialData.benefits).flat()
            : [],
          specifications: Array.isArray(initialData.specifications)
            ? initialData.specifications
            : typeof initialData.specifications === "string"
            ? [initialData.specifications]
            : initialData.specifications
            ? Object.values(initialData.specifications).flat()
            : [],
          isOutOfStock: initialData.isOutOfStock || false, // Set default value for isOutOfStock
        }
      : {
          name: "",
          description: "",
          subLabel: "",
          images: [],
          categoryIds: [],
          variants: [
            {
              id: uuidv4(),
              sizeId: "",
              colorId: null,
              price: 0,
              mrp: 0,
            },
          ],
          badgeIds: [],
          productBanners: [],
          benefits: [],
          specifications: [],
          isOutOfStock: false, // Set default value for isOutOfStock
        },
  });

  const onSubmit = async (data: ProductFormValues) => {
    try {
      const { storeid, productId } = params;
      setLoading(true);

      // Ensure variants have valid pricing
      const processedVariants = data.variants.map((v) => {
        // Set default price to 0 if not provided
        const price = v.price !== undefined && v.price !== null
          ? v.price
          : 0;

        // Set default MRP to price if not provided
        const mrp = v.mrp !== undefined && v.mrp !== null
          ? v.mrp
          : price;

        return {
          id: v.id,
          sizeId: v.sizeId,
          colorId: v.colorId,
          price: Math.max(0, Number(price)),
          mrp: Math.max(Number(mrp), Number(price)),
        };
      });

      const payload = {
        name: data.name,
        description: data.description || "",
        subLabel: data.subLabel || "",
        variants: processedVariants,
        images: data.images.map((img) => ({ url: img.url })),
        categories: data.categoryIds 
          ? data.categoryIds.map(categoryId => ({ categoryId }))
          : [],
        badges: data.badgeIds 
          ? data.badgeIds.map(badgeId => ({ badgeId }))
          : [],
        productBanner: data.productBanners || [],
        benefits: data.benefits?.length ? data.benefits : null,
        specifications: data.specifications?.length
          ? data.specifications
          : null,
        isOutOfStock: data.isOutOfStock, // Add isOutOfStock to payload
        // Provide default pricing if not set
        price: processedVariants.length > 0
          ? Math.min(...processedVariants.map((v) => v.price))
          : 0,
        mrp: processedVariants.length > 0
          ? Math.max(...processedVariants.map((v) => v.mrp))
          : 0,
      };

      if (!storeid) {
        console.error("No store ID provided");
        toast.error("Store ID is required");
        return;
      }

      try {
        const response = productId && productId !== "new"
          ? await axios.patch(`/api/${storeid}/products/${productId}`, payload)
          : await axios.post(`/api/${storeid}/products`, payload);

        console.log("[PRODUCT_FORM_RESPONSE]", response.data);

        router.refresh();
        router.push(`/${storeid}/products`);
        toast.success(toastMessage);
      } catch (apiError: any) {
        // Handle specific API error responses
        if (apiError.response) {
          // The request was made and the server responded with a status code
          const errorData = apiError.response.data;
          console.error("[PRODUCT_FORM_API_ERROR]", errorData);

          // Detailed error handling
          if (typeof errorData === "object") {
            if (errorData.details && Array.isArray(errorData.details)) {
              // If details is an array of validation errors
              const errorMessages = errorData.details.slice(0, 3); // Limit to first 3 errors
              toast.error(
                errorMessages.length > 1
                  ? `Multiple errors: ${errorMessages.join("; ")}`
                  : errorMessages[0] || "Validation error"
              );
            } else if (errorData.error) {
              // If there's a specific error message
              toast.error(errorData.error);
            } else {
              // Fallback generic error
              toast.error("Failed to save product. Please check your inputs.");
            }
          } else {
            // Fallback for unexpected error format
            toast.error(apiError.response.data || "An error occurred while saving the product");
          }
        } else if (apiError.request) {
          // The request was made but no response was received
          console.error("[PRODUCT_FORM_NO_RESPONSE]", apiError.request);
          toast.error("No response from server. Please check your network connection.");
        } else {
          // Something happened in setting up the request
          console.error("[PRODUCT_FORM_REQUEST_ERROR]", apiError.message);
          toast.error("An unexpected error occurred. Please try again.");
        }
      }
    } catch (error) {
      console.error("[PRODUCT_FORM_UNEXPECTED_ERROR]", error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    try {
      setLoading(true);
      await axios.delete(`/api/${params.storeid}/products/${params.productId}`);
      router.refresh();
      router.push(`/${params.storeid}/products`);
      toast.success("Product deleted");
    } catch (error) {
      toast.error("Something went wrong");
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
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Images Section */}
            <FormField
              control={form.control}
              name="images"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Images</FormLabel>
                  <FormControl>
                    <ImageUpload
                      folderId="67cf1a190017d6c15889"
                      value={(field.value ?? []).map((image) => image.url)}
                      disabled={loading}
                      onChange={(url) =>
                        field.onChange([...(field.value ?? []), { url }])
                      }
                      onRemove={(url) =>
                        field.onChange(
                          (field.value ?? []).filter(
                            (current) => current.url !== url
                          )
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Product Banners Section */}
            <FormField
              control={form.control}
              name="productBanners"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Banner Images</FormLabel>
                  <FormControl>
                    <ImageUpload
                      folderId="67cf1a190017d6c15889"
                      value={(field.value || []).map((banner) => banner.url)}
                      disabled={loading}
                      onChange={(url) =>
                        field.onChange([...(field.value || []), { url }])
                      }
                      onRemove={(url) =>
                        field.onChange(
                          (field.value || []).filter(
                            (current) => current.url !== url
                          )
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Basic Info */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input
                        disabled={loading}
                        placeholder="Product name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subLabel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sub Label</FormLabel>
                    <FormControl>
                      <Input
                        disabled={loading}
                        placeholder="Product sub label"
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
                      <Textarea
                        disabled={loading}
                        placeholder="Product description"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Categories and Badges */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="categoryIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categories</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                        >
                          <CheckIcon className="mr-2 h-4 w-4" />
                          {(field.value ?? []).length > 0 ? (
                            <span className="text-muted-foreground">
                              {(field.value ?? [])
                                .map(
                                  (id) =>
                                    categories.find((c) => c.id === id)?.name
                                )
                                .join(", ")}
                            </span>
                          ) : (
                            <span>Select categories</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search categories..." />
                          <CommandGroup>
                            {categories.map((category) => (
                              <CommandItem
                                key={category.id}
                                value={category.id}
                                onSelect={() => {
                                  const currentValues = field.value ?? [];
                                  const newValues = currentValues.includes(
                                    category.id
                                  )
                                    ? currentValues.filter(
                                        (v) => v !== category.id
                                      )
                                    : [...currentValues, category.id];
                                  field.onChange(newValues);
                                }}
                              >
                                <Checkbox
                                  checked={(field.value ?? []).includes(
                                    category.id
                                  )}
                                  className="mr-2"
                                />
                                {category.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="badgeIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Badges</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                        >
                          <CheckIcon className="mr-2 h-4 w-4" />
                          {(field.value ?? []).length > 0 ? (
                            <span className="text-muted-foreground">
                              {(field.value ?? [])
                                .map(
                                  (id) => badges.find((b) => b.id === id)?.label
                                )
                                .join(", ")}
                            </span>
                          ) : (
                            <span>Select badges</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search badges..." />
                          <CommandGroup>
                            {badges.map((badge) => (
                              <CommandItem
                                key={badge.id}
                                value={badge.id}
                                onSelect={() => {
                                  const currentValues = field.value ?? [];
                                  const newValues = currentValues.includes(
                                    badge.id
                                  )
                                    ? currentValues.filter(
                                        (v) => v !== badge.id
                                      )
                                    : [...currentValues, badge.id];
                                  field.onChange(newValues);
                                }}
                              >
                                <Checkbox
                                  checked={(field.value ?? []).includes(
                                    badge.id
                                  )}
                                  className="mr-2"
                                />
                                {badge.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Benefits Section */}

              <FormField
                control={form.control}
                name="benefits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel> Product Benefits</FormLabel>
                    <FormControl>
                      <MultiSelectInput
                        value={field.value || []}
                        onChange={field.onChange}
                        placeholder="Enter a benefit and press Enter"
                        disabled={loading}
                      />
                    </FormControl>
                    <FormDescription>
                      Add multiple benefits by typing and pressing Enter
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Specifications Section */}

              <FormField
                control={form.control}
                name="specifications"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel> Product Specifications</FormLabel>
                    <FormControl>
                      <MultiSelectInput
                        value={field.value || []}
                        onChange={field.onChange}
                        placeholder="Enter a specification and press Enter"
                        disabled={loading}
                      />
                    </FormControl>
                    <FormDescription>
                      Add multiple specifications by typing and pressing Enter
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Out of Stock Section */}

              <FormField
                control={form.control}
                name="isOutOfStock"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Out of Stock
                      </FormLabel>
                      <FormDescription>
                        Mark this product as currently unavailable
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Variants Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Product Variants</h3>
            {(form.watch("variants") || []).map((variant, index) => (
              <div
                key={variant.id}
                className="grid grid-cols-1 md:grid-cols-4 gap-4 border p-4 rounded-lg"
              >
                <FormField
                  control={form.control}
                  name={`variants.${index}.sizeId`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Size</FormLabel>
                      <FormControl>
                        <Select
                          disabled={loading}
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a size" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {sizes.map((size) => (
                              <SelectItem key={size.id} value={size.id}>
                                {size.value}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`variants.${index}.colorId`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <Select
                          disabled={loading}
                          onValueChange={field.onChange}
                          value={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a color" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {colors.map((color) => (
                              <SelectItem key={color.id} value={color.id}>
                                {color.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`variants.${index}.price`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          disabled={loading}
                          placeholder="Price"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`variants.${index}.mrp`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>MRP</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          disabled={loading}
                          placeholder="MRP"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    const variants = form.getValues("variants") || [];
                    form.setValue(
                      "variants",
                      variants.filter((_, i) => i !== index)
                    );
                  }}
                >
                  Remove Variant
                </Button>
              </div>
            ))}
            <Button
              type="button"
              onClick={() => {
                const currentVariants = form.getValues("variants") || [];
                form.setValue("variants", [
                  ...currentVariants,
                  { id: uuidv4(), sizeId: "", colorId: "", price: 0, mrp: 0 },
                ]);
              }}
            >
              Add Variant
            </Button>
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
