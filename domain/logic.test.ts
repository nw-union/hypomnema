import { describe, expect, it } from "bun:test";
import {
  addAfterItem,
  addItem,
  deleteItem,
  getBreadcrumb,
  hasChildren,
  newItem,
  toggleExpanded,
  updateText,
} from "./logic";
import type { Item } from "./item";

const mockItem: Item = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  symbol: "dot",
  text: "Sample Item",
  children: [],
  isExpanded: true,
};

// -----------------------------------------------------------------------------

describe("hasChildren", () => {
  it("子要素を持つアイテムの場合, true となる", () => {
    // Arrange
    const item = {
      ...mockItem,
      children: [newItem("test-child-id")],
    };

    // Act
    const result = hasChildren(item);

    // Assert
    expect(result).toBe(true);
  });

  it("子要素を持たない（空配列）アイテムの場合, false となる", () => {
    // Arrange
    const item = {
      ...mockItem,
      children: [],
    };

    // Act
    const result = hasChildren(item);

    // Assert
    expect(result).toBe(false);
  });

  it("複数の子要素を持つアイテムの場合, true となる", () => {
    // Arrange
    const item = {
      ...mockItem,
      children: [newItem("child-1"), newItem("child-2"), newItem("child-3")],
    };

    // Act
    const result = hasChildren(item);

    // Assert
    expect(result).toBe(true);
  });
});

// -----------------------------------------------------------------------------

describe("updateText", () => {
  it("指定されたIDのアイテムのテキストを更新できる", () => {
    // Arrange
    const targetId = "target-item-id";
    const items: Item[] = [
      mockItem,
      {
        ...mockItem,
        id: targetId,
        text: "古いテキスト",
      },
      {
        ...mockItem,
        id: "another-item-id",
        text: "別のテキスト",
      },
    ];
    const newText = "新しいテキスト";

    // Act
    const result = updateText(items, targetId, newText);

    // Assert
    expect(result[0].text).toBe("Sample Item"); // 変更されない
    expect(result[1].text).toBe("新しいテキスト"); // 更新される
    expect(result[2].text).toBe("別のテキスト"); // 変更されない
  });

  it("ネストされたアイテムの場合, 更新できる", () => {
    // Arrange
    const targetId = "nested-target-id";
    const items: Item[] = [
      {
        ...mockItem,
        children: [
          {
            ...mockItem,
            id: "nested-item-1",
            text: "ネストされたアイテム1",
          },
          {
            ...mockItem,
            id: targetId,
            text: "古いネストされたテキスト",
          },
        ],
      },
    ];
    const newText = "新しいネストされたテキスト";

    // Act
    const result = updateText(items, targetId, newText);

    // Assert
    expect(result[0].children[0].text).toBe("ネストされたアイテム1"); // 変更されない
    expect(result[0].children[1].text).toBe("新しいネストされたテキスト"); // 更新される
  });

  it("深くネストされたアイテムのテキストも更新できる", () => {
    // Arrange
    const targetId = "deep-nested-target";
    const items: Item[] = [
      {
        ...mockItem,
        children: [
          {
            ...mockItem,
            children: [
              {
                ...mockItem,
                children: [
                  {
                    ...mockItem,
                    id: targetId,
                    text: "深くネストされた古いテキスト",
                  },
                ],
              },
            ],
          },
        ],
      },
    ];
    const newText = "深くネストされた新しいテキスト";

    // Act
    const result = updateText(items, targetId, newText);

    // Assert
    expect(result[0].children[0].children[0].children[0].text).toBe(
      "深くネストされた新しいテキスト",
    );
  });

  it("存在しないIDを指定した場合, リストは変更されない", () => {
    // Arrange
    const items: Item[] = [
      mockItem,
      {
        ...mockItem,
        id: "existing-id",
        text: "既存のテキスト",
      },
    ];
    const nonExistentId = "non-existent-id";
    const newText = "新しいテキスト";

    // Act
    const result = updateText(items, nonExistentId, newText);

    // Assert
    expect(result[0].text).toBe("Sample Item");
    expect(result[1].text).toBe("既存のテキスト");
    // 元の配列と同じ構造であることを確認
    expect(result).toEqual(items);
  });

  it("空のリストに対して更新を試みても, 空のリストが返される", () => {
    // Arrange
    const items: Item[] = [];
    const targetId = "any-id";
    const newText = "新しいテキスト";

    // Act
    const result = updateText(items, targetId, newText);

    // Assert
    expect(result).toEqual([]);
  });
});

// -----------------------------------------------------------------------------

describe("toggleExpanded", () => {
  it("指定されたIDのアイテムのisExpandedをトグルできる（true → false）", () => {
    // Arrange
    const targetId = "target-item-id";
    const items: Item[] = [
      {
        ...mockItem,
        id: targetId,
        isExpanded: true,
      },
      {
        ...mockItem,
        id: "another-item-id",
        isExpanded: false,
      },
    ];

    // Act
    const result = toggleExpanded(items, targetId);

    // Assert
    expect(result[0].isExpanded).toBe(false); // トグルされる
    expect(result[1].isExpanded).toBe(false); // 変更されない
  });

  it("指定されたIDのアイテムのisExpandedをトグルできる（false → true）", () => {
    // Arrange
    const targetId = "target-item-id";
    const items: Item[] = [
      {
        ...mockItem,
        id: targetId,
        isExpanded: false,
      },
    ];

    // Act
    const result = toggleExpanded(items, targetId);

    // Assert
    expect(result[0].isExpanded).toBe(true); // トグルされる
  });

  it("ネストされたアイテムのisExpandedもトグルできる", () => {
    // Arrange
    const targetId = "nested-target-id";
    const items: Item[] = [
      {
        ...mockItem,
        isExpanded: true,
        children: [
          {
            ...mockItem,
            id: "nested-item-1",
            isExpanded: false,
          },
          {
            ...mockItem,
            id: targetId,
            isExpanded: true,
          },
        ],
      },
    ];

    // Act
    const result = toggleExpanded(items, targetId);

    // Assert
    expect(result[0].isExpanded).toBe(true); // 親は変更されない
    expect(result[0].children[0].isExpanded).toBe(false); // 変更されない
    expect(result[0].children[1].isExpanded).toBe(false); // トグルされる
  });

  it("存在しないIDを指定した場合, リストは変更されない", () => {
    // Arrange
    const items: Item[] = [
      {
        ...mockItem,
        id: "existing-id",
        isExpanded: true,
      },
    ];
    const nonExistentId = "non-existent-id";

    // Act
    const result = toggleExpanded(items, nonExistentId);

    // Assert
    expect(result[0].isExpanded).toBe(true);
    expect(result).toEqual(items);
  });
});

// -----------------------------------------------------------------------------

describe("deleteItem", () => {
  it("子要素を持たないアイテムを削除できる", () => {
    // Arrange
    const targetId = "target-item-id";
    const items: Item[] = [
      mockItem,
      {
        ...mockItem,
        id: targetId,
        text: "削除されるアイテム",
      },
      {
        ...mockItem,
        id: "another-item-id",
        text: "残るアイテム",
      },
    ];

    // Act
    const result = deleteItem(items, targetId);

    // Assert
    expect(result.length).toBe(2);
    expect(result[0]).toEqual(mockItem);
    expect(result[1].id).toBe("another-item-id");
  });

  it("子要素を持つアイテムで, force=falseの場合, 削除されない", () => {
    // Arrange
    const targetId = "parent-item-id";
    const items: Item[] = [
      {
        ...mockItem,
        id: targetId,
        text: "親アイテム",
        children: [
          {
            ...mockItem,
            id: "child-item-id",
            text: "子アイテム",
          },
        ],
      },
    ];

    // Act
    const result = deleteItem(items, targetId, false);

    // Assert
    expect(result.length).toBe(1);
    expect(result[0].id).toBe(targetId);
    expect(result[0].children.length).toBe(1);
  });

  it("子要素を持つアイテムで, force=true の場合, 削除される", () => {
    // Arrange
    const targetId = "parent-item-id";
    const items: Item[] = [
      {
        ...mockItem,
        id: targetId,
        text: "親アイテム",
        children: [
          {
            ...mockItem,
            id: "child-item-id",
            text: "子アイテム",
          },
        ],
      },
      {
        ...mockItem,
        id: "another-item-id",
        text: "残るアイテム",
      },
    ];

    // Act
    const result = deleteItem(items, targetId, true);

    // Assert
    expect(result.length).toBe(1);
    expect(result[0].id).toBe("another-item-id");
  });

  it("ネストされたアイテムも削除できる", () => {
    // Arrange
    const targetId = "nested-target-id";
    const items: Item[] = [
      {
        ...mockItem,
        children: [
          {
            ...mockItem,
            id: "nested-item-1",
            text: "ネストされたアイテム1",
          },
          {
            ...mockItem,
            id: targetId,
            text: "削除されるネストされたアイテム",
          },
          {
            ...mockItem,
            id: "nested-item-3",
            text: "ネストされたアイテム3",
          },
        ],
      },
    ];

    // Act
    const result = deleteItem(items, targetId);

    // Assert
    expect(result[0].children.length).toBe(2);
    expect(result[0].children[0].id).toBe("nested-item-1");
    expect(result[0].children[1].id).toBe("nested-item-3");
  });

  it("深くネストされたアイテムも削除できる", () => {
    // Arrange
    const targetId = "deep-nested-target";
    const items: Item[] = [
      {
        ...mockItem,
        children: [
          {
            ...mockItem,
            children: [
              {
                ...mockItem,
                children: [
                  {
                    ...mockItem,
                    id: "deep-item-1",
                  },
                  {
                    ...mockItem,
                    id: targetId,
                  },
                ],
              },
            ],
          },
        ],
      },
    ];

    // Act
    const result = deleteItem(items, targetId);

    // Assert
    expect(result[0].children[0].children[0].children.length).toBe(1);
    expect(result[0].children[0].children[0].children[0].id).toBe(
      "deep-item-1",
    );
  });

  it("存在しないIDを指定した場合, リストは変更されない", () => {
    // Arrange
    const items: Item[] = [
      mockItem,
      {
        ...mockItem,
        id: "existing-id",
        text: "既存のアイテム",
      },
    ];
    const nonExistentId = "non-existent-id";

    // Act
    const result = deleteItem(items, nonExistentId);

    // Assert
    expect(result.length).toBe(2);
    expect(result).toEqual(items);
  });

  it("空のリストに対して削除を試みても, 空のリストが返される", () => {
    // Arrange
    const items: Item[] = [];
    const targetId = "any-id";

    // Act
    const result = deleteItem(items, targetId);

    // Assert
    expect(result).toEqual([]);
  });

  it("ネストされた子要素を持つアイテムも, force=true で親子ともに削除される", () => {
    // Arrange
    const parentId = "parent-with-nested-children";
    const items: Item[] = [
      {
        ...mockItem,
        id: parentId,
        children: [
          {
            ...mockItem,
            id: "child-1",
            children: [
              {
                ...mockItem,
                id: "grandchild-1",
              },
            ],
          },
        ],
      },
      {
        ...mockItem,
        id: "sibling-item",
      },
    ];

    // Act
    const result = deleteItem(items, parentId, true);

    // Assert
    expect(result.length).toBe(1);
    expect(result[0].id).toBe("sibling-item");
  });
});

// -----------------------------------------------------------------------------

describe("addItem", () => {
  it("子要素を持たないアイテムの直後に新しいアイテムを追加できる", () => {
    // Arrange
    const targetId = "target-item-id";
    const newId = "new-item-id";
    const items: Item[] = [
      {
        ...mockItem,
        id: targetId,
        text: "ターゲットアイテム",
      },
      {
        ...mockItem,
        id: "another-item-id",
        text: "別のアイテム",
      },
    ];

    // Act
    const result = addItem(items, targetId, newId);

    // Assert
    expect(result.length).toBe(3);
    expect(result[0].id).toBe(targetId);
    expect(result[1].id).toBe(newId);
    expect(result[2].id).toBe("another-item-id");
  });

  it("展開されていないアイテムの直後に新しいアイテムを追加できる", () => {
    // Arrange
    const targetId = "collapsed-parent-id";
    const newId = "new-item-id";
    const items: Item[] = [
      {
        ...mockItem,
        id: targetId,
        text: "折りたたまれた親",
        isExpanded: false,
        children: [
          {
            ...mockItem,
            id: "child-item-id",
            text: "子アイテム",
          },
        ],
      },
    ];

    // Act
    const result = addItem(items, targetId, newId);

    // Assert
    expect(result.length).toBe(2);
    expect(result[0].id).toBe(targetId);
    expect(result[0].children.length).toBe(1); // 子要素は変更されない
    expect(result[1].id).toBe(newId);
  });

  it("展開されているアイテムの子要素の先頭に新しいアイテムを追加できる", () => {
    // Arrange
    const targetId = "expanded-parent-id";
    const newId = "new-item-id";
    const items: Item[] = [
      {
        ...mockItem,
        id: targetId,
        text: "展開された親",
        isExpanded: true,
        children: [
          {
            ...mockItem,
            id: "existing-child-id",
            text: "既存の子",
          },
        ],
      },
    ];

    // Act
    const result = addItem(items, targetId, newId);

    // Assert
    expect(result.length).toBe(1);
    expect(result[0].children.length).toBe(2);
    expect(result[0].children[0].id).toBe(newId); // 先頭に追加
    expect(result[0].children[1].id).toBe("existing-child-id");
  });

  it("ネストされたアイテムに対しても正しく追加できる", () => {
    // Arrange
    const targetId = "nested-target-id";
    const newId = "new-item-id";
    const items: Item[] = [
      {
        ...mockItem,
        children: [
          {
            ...mockItem,
            id: "parent-id",
            children: [
              {
                ...mockItem,
                id: targetId,
                text: "ネストされたターゲット",
              },
            ],
          },
        ],
      },
    ];

    // Act
    const result = addItem(items, targetId, newId);

    // Assert
    expect(result[0].children[0].children.length).toBe(2);
    expect(result[0].children[0].children[0].id).toBe(targetId);
    expect(result[0].children[0].children[1].id).toBe(newId);
  });

  it("深くネストされたアイテムでも正しく追加できる", () => {
    // Arrange
    const targetId = "deep-nested-target";
    const newId = "new-item-id";
    const items: Item[] = [
      {
        ...mockItem,
        children: [
          {
            ...mockItem,
            children: [
              {
                ...mockItem,
                children: [
                  {
                    ...mockItem,
                    id: targetId,
                    text: "深くネストされたターゲット",
                  },
                  {
                    ...mockItem,
                    id: "sibling-id",
                    text: "兄弟アイテム",
                  },
                ],
              },
            ],
          },
        ],
      },
    ];

    // Act
    const result = addItem(items, targetId, newId);

    // Assert
    expect(result[0].children[0].children[0].children.length).toBe(3);
    expect(result[0].children[0].children[0].children[0].id).toBe(targetId);
    expect(result[0].children[0].children[0].children[1].id).toBe(newId);
    expect(result[0].children[0].children[0].children[2].id).toBe("sibling-id");
  });

  it("存在しないIDを指定した場合, リストは変更されない", () => {
    // Arrange
    const items: Item[] = [
      mockItem,
      {
        ...mockItem,
        id: "existing-id",
        text: "既存のアイテム",
      },
    ];
    const nonExistentId = "non-existent-id";
    const newId = "new-item-id";

    // Act
    const result = addItem(items, nonExistentId, newId);

    // Assert
    expect(result.length).toBe(2);
    expect(result).toEqual(items);
  });

  it("リストの最後のアイテムの後に追加できる", () => {
    // Arrange
    const targetId = "last-item-id";
    const newId = "new-item-id";
    const items: Item[] = [
      mockItem,
      {
        ...mockItem,
        id: targetId,
        text: "最後のアイテム",
      },
    ];

    // Act
    const result = addItem(items, targetId, newId);

    // Assert
    expect(result.length).toBe(3);
    expect(result[2].id).toBe(newId);
  });

  it("空の子要素を持つ展開されたアイテムに対して子要素として追加できる", () => {
    // Arrange
    const targetId = "empty-parent-id";
    const newId = "new-item-id";
    const items: Item[] = [
      {
        ...mockItem,
        id: targetId,
        text: "空の親",
        isExpanded: true,
        children: [],
      },
    ];

    // Act
    const result = addItem(items, targetId, newId);

    // Assert
    expect(result.length).toBe(2);
    expect(result[0].id).toBe(targetId);
    expect(result[1].id).toBe(newId); // 子要素がないので直後に追加
  });
});

// -----------------------------------------------------------------------------

describe("addAfterItem", () => {
  it("指定されたIDのアイテムの直後に新しいアイテムを追加できる", () => {
    // Arrange
    const targetId = "target-item-id";
    const items: Item[] = [
      {
        ...mockItem,
        id: targetId,
        text: "ターゲットアイテム",
      },
      {
        ...mockItem,
        id: "another-item-id",
        text: "別のアイテム",
      },
    ];
    const newItemToAdd: Item = {
      ...mockItem,
      id: "new-item-id",
      text: "新しいアイテム",
    };

    // Act
    const result = addAfterItem(items, targetId, newItemToAdd);

    // Assert
    expect(result.length).toBe(3);
    expect(result[0].id).toBe(targetId);
    expect(result[1].id).toBe("new-item-id");
    expect(result[2].id).toBe("another-item-id");
  });

  it("リストの最後のアイテムの後に追加できる", () => {
    // Arrange
    const targetId = "last-item-id";
    const items: Item[] = [
      mockItem,
      {
        ...mockItem,
        id: targetId,
        text: "最後のアイテム",
      },
    ];
    const newItemToAdd: Item = {
      ...mockItem,
      id: "new-item-id",
      text: "新しいアイテム",
    };

    // Act
    const result = addAfterItem(items, targetId, newItemToAdd);

    // Assert
    expect(result.length).toBe(3);
    expect(result[0].id).toBe(mockItem.id);
    expect(result[1].id).toBe(targetId);
    expect(result[2].id).toBe("new-item-id");
  });

  it("ネストされたアイテムの後にも追加できる", () => {
    // Arrange
    const targetId = "nested-target-id";
    const items: Item[] = [
      {
        ...mockItem,
        children: [
          {
            ...mockItem,
            id: "nested-item-1",
            text: "ネストされたアイテム1",
          },
          {
            ...mockItem,
            id: targetId,
            text: "ターゲットアイテム",
          },
          {
            ...mockItem,
            id: "nested-item-3",
            text: "ネストされたアイテム3",
          },
        ],
      },
    ];
    const newItemToAdd: Item = {
      ...mockItem,
      id: "new-item-id",
      text: "新しいアイテム",
    };

    // Act
    const result = addAfterItem(items, targetId, newItemToAdd);

    // Assert
    expect(result[0].children.length).toBe(4);
    expect(result[0].children[0].id).toBe("nested-item-1");
    expect(result[0].children[1].id).toBe(targetId);
    expect(result[0].children[2].id).toBe("new-item-id");
    expect(result[0].children[3].id).toBe("nested-item-3");
  });

  it("深くネストされたアイテムの後にも追加できる", () => {
    // Arrange
    const targetId = "deep-nested-target";
    const items: Item[] = [
      {
        ...mockItem,
        children: [
          {
            ...mockItem,
            children: [
              {
                ...mockItem,
                children: [
                  {
                    ...mockItem,
                    id: targetId,
                    text: "深くネストされたターゲット",
                  },
                ],
              },
            ],
          },
        ],
      },
    ];
    const newItemToAdd: Item = {
      ...mockItem,
      id: "new-item-id",
      text: "新しいアイテム",
    };

    // Act
    const result = addAfterItem(items, targetId, newItemToAdd);

    // Assert
    expect(result[0].children[0].children[0].children.length).toBe(2);
    expect(result[0].children[0].children[0].children[0].id).toBe(targetId);
    expect(result[0].children[0].children[0].children[1].id).toBe(
      "new-item-id",
    );
  });

  it("存在しないIDを指定した場合, リストは変更されない", () => {
    // Arrange
    const items: Item[] = [
      mockItem,
      {
        ...mockItem,
        id: "existing-id",
        text: "既存のアイテム",
      },
    ];
    const nonExistentId = "non-existent-id";
    const newItemToAdd: Item = {
      ...mockItem,
      id: "new-item-id",
      text: "新しいアイテム",
    };

    // Act
    const result = addAfterItem(items, nonExistentId, newItemToAdd);

    // Assert
    expect(result.length).toBe(2);
    expect(result).toEqual(items);
  });

  it("複数の同じレベルのアイテムがある場合, 正しい位置に追加される", () => {
    // Arrange
    const targetId = "middle-item";
    const items: Item[] = [
      {
        ...mockItem,
        id: "first-item",
        text: "最初のアイテム",
      },
      {
        ...mockItem,
        id: targetId,
        text: "中間のアイテム",
      },
      {
        ...mockItem,
        id: "last-item",
        text: "最後のアイテム",
      },
    ];
    const newItemToAdd: Item = {
      ...mockItem,
      id: "new-item-id",
      text: "新しいアイテム",
    };

    // Act
    const result = addAfterItem(items, targetId, newItemToAdd);

    // Assert
    expect(result.length).toBe(4);
    expect(result[0].id).toBe("first-item");
    expect(result[1].id).toBe(targetId);
    expect(result[2].id).toBe("new-item-id");
    expect(result[3].id).toBe("last-item");
  });

  it("子要素を持つアイテムも正しく追加できる", () => {
    // Arrange
    const targetId = "parent-item";
    const items: Item[] = [
      {
        ...mockItem,
        id: targetId,
        text: "親アイテム",
        children: [
          {
            ...mockItem,
            id: "child-item",
            text: "子アイテム",
          },
        ],
      },
    ];
    const newItemToAdd: Item = {
      ...mockItem,
      id: "new-parent-id",
      text: "新しい親アイテム",
      children: [
        {
          ...mockItem,
          id: "new-child-id",
          text: "新しい子アイテム",
        },
      ],
    };

    // Act
    const result = addAfterItem(items, targetId, newItemToAdd);

    // Assert
    expect(result.length).toBe(2);
    expect(result[0].id).toBe(targetId);
    expect(result[0].children.length).toBe(1);
    expect(result[1].id).toBe("new-parent-id");
    expect(result[1].children.length).toBe(1);
    expect(result[1].children[0].id).toBe("new-child-id");
  });
});

// -----------------------------------------------------------------------------

describe("getBreadcrumb", () => {
  it("ルートレベルのアイテムのパンクズを取得できる", () => {
    // Arrange
    const targetId = "root-item-id";
    const items: Item[] = [
      {
        ...mockItem,
        id: targetId,
        text: "ルートアイテム",
      },
      {
        ...mockItem,
        id: "another-root-id",
        text: "別のルートアイテム",
      },
    ];

    // Act
    const result = getBreadcrumb(items, targetId);

    // Assert
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual([{ id: targetId, text: "ルートアイテム" }]);
    }
  });

  it("ネストされたアイテムのパンクズを取得できる", () => {
    // Arrange
    const targetId = "child-item-id";
    const items: Item[] = [
      {
        ...mockItem,
        id: "parent-id",
        text: "親アイテム",
        children: [
          {
            ...mockItem,
            id: targetId,
            text: "子アイテム",
          },
        ],
      },
    ];

    // Act
    const result = getBreadcrumb(items, targetId);

    // Assert
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual([
        { id: "parent-id", text: "親アイテム" },
        { id: targetId, text: "子アイテム" },
      ]);
    }
  });

  it("深くネストされたアイテムのパンクズを取得できる", () => {
    // Arrange
    const targetId = "grandchild-id";
    const items: Item[] = [
      {
        ...mockItem,
        id: "root-id",
        text: "ルート",
        children: [
          {
            ...mockItem,
            id: "parent-id",
            text: "親",
            children: [
              {
                ...mockItem,
                id: targetId,
                text: "孫",
              },
            ],
          },
        ],
      },
    ];

    // Act
    const result = getBreadcrumb(items, targetId);

    // Assert
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual([
        { id: "root-id", text: "ルート" },
        { id: "parent-id", text: "親" },
        { id: targetId, text: "孫" },
      ]);
    }
  });

  it("存在しないIDを指定した場合エラーが返される", () => {
    // Arrange
    const items: Item[] = [
      {
        ...mockItem,
        id: "existing-id",
        text: "既存のアイテム",
      },
    ];
    const nonExistentId = "non-existent-id";

    // Act
    const result = getBreadcrumb(items, nonExistentId);

    // Assert
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toBe(
        "Item with ID non-existent-id not found",
      );
    }
  });

  it("複数のブランチがある場合、正しいパスを返す", () => {
    // Arrange
    const targetId = "target-in-branch-2";
    const items: Item[] = [
      {
        ...mockItem,
        id: "branch-1",
        text: "ブランチ1",
        children: [
          {
            ...mockItem,
            id: "branch-1-child",
            text: "ブランチ1の子",
          },
        ],
      },
      {
        ...mockItem,
        id: "branch-2",
        text: "ブランチ2",
        children: [
          {
            ...mockItem,
            id: targetId,
            text: "ブランチ2の子",
          },
        ],
      },
    ];

    // Act
    const result = getBreadcrumb(items, targetId);

    // Assert
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual([
        { id: "branch-2", text: "ブランチ2" },
        { id: targetId, text: "ブランチ2の子" },
      ]);
    }
  });

  it("空のリストに対してはエラーが返される", () => {
    // Arrange
    const items: Item[] = [];
    const targetId = "any-id";

    // Act
    const result = getBreadcrumb(items, targetId);

    // Assert
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toBe("Item with ID any-id not found");
    }
  });

  it("空のテキストを持つアイテムも正しく処理される", () => {
    // Arrange
    const targetId = "empty-text-id";
    const items: Item[] = [
      {
        ...mockItem,
        id: "parent-id",
        text: "親アイテム",
        children: [
          {
            ...mockItem,
            id: targetId,
            text: "",
          },
        ],
      },
    ];

    // Act
    const result = getBreadcrumb(items, targetId);

    // Assert
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual([
        { id: "parent-id", text: "親アイテム" },
        { id: targetId, text: "" },
      ]);
    }
  });
});
