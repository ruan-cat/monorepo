import type { array, common } from "typescript-lodash";

import { type Prettify } from "utils";

/** 装备 */
export interface Equipment {
	/** 装备名称 */
	name: string;
}

/** 攻击属性 */
type AttackProperty = {
	attack: number;
};

/** 防御属性 */
type DefenseProperty = {
	defense: number;
};

/** 暴击属性 */
type CriticalStrikeProperty = {
	criticalStrike: number;
};

/** 速度属性 */
type SpeedProperty = {
	speed: number;
};

/** 属性元组 */
type Propertys = [AttackProperty, DefenseProperty, CriticalStrikeProperty, SpeedProperty];

/** 装备属性 联合类型 */
type EquipmentUnionPropertys = array.TupleToUnion<Propertys>;

/** 装备属性 交叉类型 */
type EquipmenIntersectionPropertys = common.UnionToIntersection<EquipmentUnionPropertys>;
type EquipmenIntersectionPropertysP = Prettify<EquipmenIntersectionPropertys>;

/** 带有属性的装备 */
export type EquipmentWithPropertys = Equipment & Partial<EquipmenIntersectionPropertys>;
type EquipmentWithPropertysP = Prettify<EquipmentWithPropertys>;
