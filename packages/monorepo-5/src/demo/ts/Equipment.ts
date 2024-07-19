// import type { TupleToUnion } from "typescript-lodash/lib/array";
import type { array, common } from "typescript-lodash";

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

type Propertys = [AttackProperty, DefenseProperty, CriticalStrikeProperty, SpeedProperty];

// interface EquipmentPropertys
type EquipmentUnionPropertys = array.TupleToUnion<Propertys>;

type EquipmenIntersectionPropertys = common.UnionToIntersection<EquipmentUnionPropertys>;

// export interface EquipmentWithPropertys extends Equipment, EquipmentPropertys {}
// propertys:

export interface EquipmentWithPropertys {}
