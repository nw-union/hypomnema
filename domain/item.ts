export type Item = {
  id: string;
  symbol: "dot" | "naraba" | "therefore" | "because" | "equal" | "notEqual";
  text: string;
  children: Item[];
  isExpanded: boolean;
};
