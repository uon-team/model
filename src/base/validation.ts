import { Type, Injector, PropertyNamesNotOfType } from '@uon/core';
import { Model } from '../meta/model.decorator';
import { FindModelAnnotation } from '../utils/model.utils';
import { Validator } from './validator';


export interface FlatValidationResult {

	/**
	 * The path to the value in the model
	 */
	path: string[];

	/**
	 * Map of validator names and associated message
	 */
	errors: { [k: string]: string };

}

/**
 * The result of validating a single value: a list of failures plus the key it
 * applies to. `ModelValidationResult` extends this with per-member children.
 */
export class ValidationResult<T> {

	readonly failures: ValidationFailure[] = [];
	readonly key: string;

	constructor(key: string) {
		this.key = key;
	}

	get valid() {
		return this.failures.length === 0;
	}

	flatten(out: FlatValidationResult[] = [], _path: string[] = []) {

		if (this.failures.length == 0) {
			return out;
		}

		const errors_by_key: {[k: string]: ValidationFailure[]} = {};

		for (let f of this.failures) {

			if(f.key != this.key && typeof f.key == 'number') {
				let arr_path =  [..._path, f.key];
				let hash = arr_path.join('.');
				errors_by_key[hash] = errors_by_key[hash] || [];
				errors_by_key[hash].push(f);
			}
			else {
				errors_by_key[this.key] = errors_by_key[this.key] || [];
				errors_by_key[this.key].push(f);
			}

		}

		for(let k in errors_by_key) {

			const errors: {[k: string]: any} = {};
			const failures = errors_by_key[k];
			for(let f of failures) {
				errors[f.validator.name] = f.context;
			}
			out.push({
				path: [k],
				errors
			});
		}


		return out;

	}
}

export type ModelPossibleValidationMember<T> = Partial<Pick<T, PropertyNamesNotOfType<T, Function>>>;
export type ModelValidationMembers<T, P = ModelPossibleValidationMember<T>> = {
	[K in keyof P]?: ValidationResult<P[K]>
}

export class ModelValidationResult<T> extends ValidationResult<T> {

	readonly children: ModelValidationMembers<T> = {};

	constructor(key: string) {
		super(key);

	}

	get valid() {

		for (let k in this.children) {
			let key = k as keyof ModelValidationMembers<T>;
			const child = this.children[key];
			if (child && !child.valid) {
				return false;
			}
		}

		return this.failures.length === 0;
	}

	flatten(out: FlatValidationResult[] = [], _path: string[] = []) {

		super.flatten(out, _path);

		for (let k in this.children) {

			let path: string[] = _path.slice(0);
			path.push(k);

			(this.children as any)[k].flatten(out, path);

		}

		return out;

	}


	filter(ignored: Function[]) {

		return this._filter(ignored, this);

	}

	private _filter(ignored: Function[], val: ValidationResult<any>) {

		let failures: ValidationFailure[] = [];
		for (let f of val.failures) {
			if (ignored.indexOf(f.validator) == -1) {
				failures.push(f);
			}
		}

		if (val instanceof ModelValidationResult) {

			let result = new ModelValidationResult<any>(val.key);
			result.failures.push(...failures);

			// recurse
			for (let k in val.children) {
				const child = val.children[k];
				if (!child) {
					continue;
				}
				let c = this._filter(ignored, child);
				result.children[k] = c;
			}

			return result;
		}

		let result = new ValidationResult<any>(val.key);
		result.failures.push(...failures);

		return result;
	}
}

export class ValidationFailure {

	constructor(
		readonly validator: Function,
		readonly key: string,
		readonly value: any,
		readonly context: any
	) {

	}
}


/**
 * Validate a model
 * @param target the model instance to validate
 * @param extraValidators a map of extra validator to run
 * @param injector An optional injector to pass to each validators, some validators will require that you pass this
 * @param _key The "parent" key in case of recursive or array validation
 */
export async function Validate<T>(target: T,
								  extraValidators: { [k: string]: Validator[] } = {},
								  injector: Injector | null = null,
								  _key?: string,
								  _skipUndefined = false): Promise<ModelValidationResult<T>> {

	// grab type
	const type = (target as any).constructor as Type<T>;
	const model = type ? FindModelAnnotation(type) as Model : null;


	const validators: { [K in keyof T]: Validator[] } = model ? Object.assign({}, model.validators as any) : {};

	// append extra validators
	const extra_keys = Object.keys(extraValidators) as unknown as (keyof T)[];
	for (let i = 0, l = extra_keys.length; i < l; ++i) {
		let k = extra_keys[i];

		validators[k] = validators[k] || [];
		validators[k] = validators[k].concat(extraValidators[k as any] as any[]);
	}

	const keys = Object.keys(validators) as unknown as (keyof ModelValidationMembers<T>)[];
	const failures: ValidationFailure[] = [];

	let result = new ModelValidationResult<T>(_key as string);

	// go over each member and call validators if any
	for (let i = 0, l = keys.length; i < l; ++i) {

		const key = keys[i];
		const v = validators[key];
		const value = (target as any)[key];

		if (Array.isArray(value)) {

			for (let i = 0, l = value.length; i < l; ++i) {
				await DoValidation(target, key, value[i], v, injector, _skipUndefined, result, i);
			}
		}
		else {
			await DoValidation(target, key, value, v, injector, _skipUndefined, result);
		}


	}


	return result;


}


async function DoValidation(target: any,
							key: any,
							value: any,
							validators: Validator[],
							injector: Injector | null,
							skipUndefined: boolean,
							result: ModelValidationResult<any>,
							_index?: number) {


	for (let j = 0, jl = validators.length; j < jl; ++j) {

		if ((value === undefined || value === '' || value === null) && (validators[j]._forceValidation !== true || skipUndefined)) {
			continue;
		}

		try {
			await validators[j](target, key as string, value, injector as Injector);
		}
		catch (err: any) {

			let is_validation_result = err instanceof ModelValidationResult;

			let child: ValidationResult<any> = result.children[key] as any;
			if (!child) {
				child = (validators[j] as any)._modelValidator
					? is_validation_result
						? err
						: new ModelValidationResult<any>(key as string)
					: new ValidationResult<any>(key as string);
				result.children[key] = child;
			}


			if (_index !== undefined) {
				(err as any).key = _index as any;
			}

			// a model validator throws its own ModelValidationResult, which
			// becomes the child node directly (assigned above). It must NOT be
			// pushed into a failures[] list — those hold ValidationFailure leaves,
			// not nested results (pushing it corrupts the tree / breaks flatten).
			if (!is_validation_result) {
				child.failures.push(err);
			}
		}
	}

}

