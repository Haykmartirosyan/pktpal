<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class ScheduleDaysRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        $rules = !empty($this->days) ? [
            'days'           => 'required|array',
            'days.*.weekday' => 'required',
        ] : [];
        return $rules;

    }

    /**
     * @param Validator $validator
     */
    public function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(response()->json([
            'success' => 0,
            'type'    => 'error',
            'message' => $validator->messages()->first()
        ], 422));
    }

    /**
     * @return string[]
     */
    public function messages()
    {
        return [
            'days.required'           => 'Please select day',
            'days.*.from.required'    => 'From is required',
            'days.*.to.required'      => 'To is required',
            'days.*.weekday.required' => 'Select a weekday',
        ];
    }
}
