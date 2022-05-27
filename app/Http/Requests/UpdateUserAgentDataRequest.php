<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class UpdateUserAgentDataRequest extends FormRequest
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
            'last_login'        => 'required',
            'device_unique_key' => 'required',
            'mac_address'       => 'required',
            'user_agent'        => 'required',
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
