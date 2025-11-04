'use client';

import React, { useState, useMemo } from 'react';
import TopBackBar from '@/components/common/TopBackBar';
import { convertSearch초성 } from '@/lib/utils/game/convertSearch초성';
import styles from './CommandForm.module.css';
import tradeEquipmentStyles from './TradeEquipmentCommandForm.module.css';

interface ItemInfo {
  id: string;
  name: string;
  reqSecu: number;
  cost: number;
  info: string;
  isBuyable: boolean;
}

interface ItemList {
  [key: string]: {
    typeName: string;
    values: ItemInfo[];
  };
}

interface OwnItem {
  [key: string]: ItemInfo;
}

interface TradeEquipmentCommandFormProps {
  commandName: string;
  citySecu: number;
  gold: number;
  itemList: ItemList;
  ownItem: OwnItem;
  onSubmit: (args: { itemType: string; itemCode: string }) => void;
  onCancel: () => void;
}

const ItemTypeNameMap: Record<string, string> = {
  horse: '명마',
  weapon: '무기',
  book: '서적',
  item: '도구',
};

const NoneValue = 'None';

interface SelectItem {
  type: string;
  id: string;
  html: string;
  simpleName: string;
  searchText: string;
  notAvailable: boolean;
  obj: ItemInfo;
}

export default function TradeEquipmentCommandForm({
  commandName,
  citySecu,
  gold,
  itemList,
  ownItem,
  onSubmit,
  onCancel
}: TradeEquipmentCommandFormProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<SelectItem | null>(null);

  // 아이템 목록 생성 (판매 + 구매)
  const forFind = useMemo(() => {
    const categories: {
      category: string;
      values: SelectItem[];
    }[] = [];

    // 판매 목록 (소유한 장비)
    const sellItems: SelectItem[] = [];
    for (const [type, ownItemData] of Object.entries(ownItem)) {
      const typeName = ItemTypeNameMap[type] || type;
      const itemNameHelp =
        ownItemData.id === NoneValue
          ? ''
          : ` [${ownItemData.name}, ${Math.floor(ownItemData.cost / 2).toLocaleString()}금]`;
      sellItems.push({
        type,
        id: NoneValue,
        html: `${typeName} 판매${itemNameHelp}`,
        simpleName: `${ownItemData.id === NoneValue ? typeName : ownItemData.name} 판매`,
        searchText: convertSearch초성(typeName).join('|'),
        notAvailable: ownItemData.id === NoneValue,
        obj: ownItemData,
      });
    }

    if (sellItems.length > 0) {
      categories.push({
        category: '소유 물품 판매',
        values: sellItems,
      });
    }

    // 구매 목록
    for (const [type, itemSubList] of Object.entries(itemList)) {
      const typeName = ItemTypeNameMap[type] || type;
      const values: SelectItem[] = [];

      for (const itemObj of itemSubList.values) {
        const notAvailable =
          itemObj.reqSecu > citySecu || gold < itemObj.cost;
        values.push({
          type,
          id: itemObj.id,
          html: `${itemObj.name} 구매 [${itemObj.cost.toLocaleString()}금, 필요 치안 ${itemObj.reqSecu.toLocaleString()}]`,
          simpleName: `${itemObj.name} 구매`,
          searchText: convertSearch초성(itemObj.name).join('|'),
          notAvailable,
          obj: itemObj,
        });
      }

      if (values.length > 0) {
        categories.push({
          category: `${typeName} 구매`,
          values,
        });
      }
    }

    return categories;
  }, [itemList, ownItem, citySecu, gold]);

  // 검색 필터링
  const filteredItems = useMemo(() => {
    if (!searchTerm) {
      return forFind;
    }

    const searchLower = searchTerm.toLowerCase();
    return forFind.map((category) => ({
      ...category,
      values: category.values.filter((item) => {
        const searchTexts = item.searchText.toLowerCase().split('|');
        return (
          item.simpleName.toLowerCase().includes(searchLower) ||
          searchTexts.some((text) => text.includes(searchLower))
        );
      }),
    }));
  }, [forFind, searchTerm]);

  // 초기 선택 아이템 설정
  React.useEffect(() => {
    if (!selectedItem && filteredItems.length > 0 && filteredItems[0].values.length > 0) {
      setSelectedItem(filteredItems[0].values[0]);
    }
  }, [filteredItems, selectedItem]);

  const handleSubmit = () => {
    if (!selectedItem) {
      alert('아이템을 선택해주세요.');
      return;
    }

    onSubmit({
      itemType: selectedItem.type,
      itemCode: selectedItem.id,
    });
  };

  return (
    <div className={styles.container}>
      <TopBackBar title={commandName} onBack={onCancel} />
      <div className={styles.content}>
        <div className={styles.description}>
          장비를 구입하거나 매각합니다.
          <br />
          현재 구입 불가능한 것은 <span style={{ color: 'red' }}>붉은색</span>으로 표시됩니다.
          <br />
          현재 도시 치안: {citySecu.toLocaleString()} &nbsp;&nbsp;&nbsp;현재 자금:{' '}
          {gold.toLocaleString()}
        </div>

        {selectedItem && (
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label>장비:</label>
              <div className={tradeEquipmentStyles.itemSelect}>
                <input
                  type="text"
                  className={styles.textInput}
                  placeholder="아이템 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                  className={styles.selectInput}
                  value={selectedItem ? `${selectedItem.type}:${selectedItem.id}` : ''}
                  onChange={(e) => {
                    const [type, id] = e.target.value.split(':');
                    const item = filteredItems
                      .flatMap((cat) => cat.values)
                      .find((i) => i.type === type && i.id === id);
                    if (item) {
                      setSelectedItem(item);
                    }
                  }}
                >
                  {filteredItems.map((category) => (
                    <optgroup key={category.category} label={category.category}>
                      {category.values.map((item) => (
                        <option
                          key={`${item.type}:${item.id}`}
                          value={`${item.type}:${item.id}`}
                        >
                          {item.notAvailable ? '[불가] ' : ''}
                          {item.simpleName}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.formActions}>
              <button
                type="button"
                onClick={handleSubmit}
                className={styles.submitButton}
              >
                {commandName}
              </button>
            </div>
          </div>
        )}

        {selectedItem && selectedItem.obj.id !== NoneValue && (
          <div className={tradeEquipmentStyles.itemInfo}>
            <div className={tradeEquipmentStyles.itemName}>{selectedItem.obj.name}</div>
            <div
              className={tradeEquipmentStyles.itemDetails}
              dangerouslySetInnerHTML={{ __html: selectedItem.obj.info }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

