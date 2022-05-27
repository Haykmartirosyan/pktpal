<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class SetAssignedDevicesRequest extends FormRequest
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
        return [
            '*.user_id'      => 'required',
            '*.order_id'     => 'required',
            '*.mac_address'  => 'required',
            '*.quantity'     => 'required',
            '*.user_email'   => 'required',
            '*.qty_assigned' => 'required',
        ];
    }

    /**
     * Failed validation
     *
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
}
