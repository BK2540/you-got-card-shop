import CustomButton from "@/components/CustomButton";
import CustomInput from "@/components/CustomInput";
import type { Card } from "@/types";
import type { ChangeEvent, FormEvent } from "react";

type HomeFormState = {
  id?: string;
  title: string;
  subtitle: string;
  description: string;
  price: string;
  featuredId: string;
};

type HomeContentFormProps = {
  cards: Card[];
  form: HomeFormState;
  loading?: boolean;
  onChange: (
    field: keyof HomeFormState,
  ) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
};

const HomeContentForm = ({
  cards,
  form,
  loading = false,
  onChange,
  onSubmit,
}: HomeContentFormProps) => {
  return (
    <main className="flex-1 space-y-10 p-8">
      <h1 className="text-2xl font-bold text-orange-500">Home Content</h1>

      <form onSubmit={onSubmit} className="space-y-4 rounded-3xl bg-surface p-6 shadow-xl">
        <CustomInput
          placeholder="Title"
          value={form.title}
          onChange={onChange("title")}
        />

        <CustomInput
          placeholder="Subtitle"
          value={form.subtitle}
          onChange={onChange("subtitle")}
        />

        <textarea
          placeholder="Description"
          className="min-h-32 w-full rounded-2xl border border-primary p-3 text-white outline-none focus:border-primary"
          value={form.description}
          onChange={onChange("description")}
        />

        <CustomInput
          type="text"
          inputMode="numeric"
          placeholder="Price"
          value={form.price}
          onChange={onChange("price")}
        />

        <select
          className="w-full rounded-2xl border border-primary bg-transparent p-3 text-white outline-none"
          value={form.featuredId}
          onChange={onChange("featuredId")}
        >
          <option value="" className="bg-surface">
            Select Card
          </option>
          {cards.map((card) => (
            <option key={card.id} value={card.id} className="bg-surface">
              {card.name}
            </option>
          ))}
        </select>

        <CustomButton
          title={loading ? "Saving..." : "Save"}
          type="submit"
          disable={loading}
        />
      </form>
    </main>
  );
};

export default HomeContentForm;
