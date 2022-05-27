<?php

namespace App\Http\Requests\api\v1;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class UpdateTransactionRequest extends FormRequest
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

        if (!$this->header('pkteer-token')) {
            throw new HttpResponseException(response()->json([
                'success' => 0,
                'message' => "The token is required."
            ], 422));
        }

        return [
            'id'            => 'required',
            'status'        => 'required',
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
            'message' => $validator->messages()->first()
        ], 422));
    }
}
