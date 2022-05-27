<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class SendPktRequest extends FormRequest
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
            'transactionData.from'        => 'required|min:10',
            'transactionData.to'          => 'required|min:10',
            'transactionData.amount'      => 'required',
            'transactionData.description' => 'nullable|regex:/(^([a-zA-Z]+)(\d+)?$)/u',
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

    /**
     * @return array
     */
    public function attributes()
    {
        return [
            'transactionData.description' => 'description',
        ];
    }
}
