export type Item = {
  id: string;
  symbol: "dot" | "naraba" | "therefore" | "equal" | "notEqual";
  text: string;
  children: Item[];
  isExpanded: boolean;
};
