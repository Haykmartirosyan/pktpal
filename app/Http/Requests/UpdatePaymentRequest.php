<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class UpdatePaymentRequest extends FormRequest
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
            'email'           => 'required',
            'bill_service_id' => !$this->service_name ? 'sometimes|required' : '',
            'service_id'      => 'required',
            'user_id'         => 'required',
            'address'         => 'required',
            'phone'           => 'required',
            'amount'          => 'required',
            'recurring'       => 'required',
            'holder_name'     => 'required',
            'service_name'    => !$this->bill_service_id ? 'sometimes|required' : '',
            'description'     => !$this->bill_service_id ? 'sometimes|required' : '',
            'direct_debit_id' => 'required'
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
