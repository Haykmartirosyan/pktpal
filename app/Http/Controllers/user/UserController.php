<?php

namespace App\Http\Controllers\user;

use App\Contracts\UsersInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use Carbon\Carbon;
use Exception;
use Illuminate\Contracts\View\Factory;
use Illuminate\Contracts\View\View;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use MikeMcLin\WpPassword\Facades\WpPassword;
use function Sentry\captureException;

class UserController extends Controller
{
    /**
     * @var UsersInterface
     */
    protected UsersInterface $usersRepository;

    /**
     * UserController constructor.
     * @param UsersInterface $usersRepository
     */
    public function __construct(UsersInterface $usersRepository)
    {
        $this->usersRepository = $usersRepository;
    }

    /**
     * @param LoginRequest $request
     * @return JsonResponse
     */
    public function login(LoginRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();
            $credentials = $request->only(["user_email", "user_pass"]);
            $user = $this->usersRepository->getByEmail($credentials['user_email']);
            if ($user) {
                if (!WpPassword::check($credentials['user_pass'], $user->user_pass)) {
                    return response()->json([
                        "success" => false,
                        "message" => 'invalid_password',
                    ], 422);
                }
                $createdToken = $user->createToken('authToken');
                $accessToken = $createdToken->accessToken;
                $expires = $createdToken->token->expires_at;

                DB::commit();
                return response()->json([
                    "success"      => true,
                    "message"      => 'Login Successful',
                    "access_token" => $accessToken,
                    "expires"      => $expires,
                ]);
            }
            DB::rollBack();
            return response()->json([
                "success" => false,
                "message" => 'invalid_email'
            ], 422);

        } catch (Exception $exception) {
            DB::rollBack();
            captureException($exception);
            return response()->json([
                "success" => false,
                "message" => $exception->getMessage()
            ], 500);
        }
    }

    /**
     * @param Request $request
     * @return JsonResponse
     */
    public function logout(Request $request): JsonResponse
    {
        try {
            DB::beginTransaction();
            $revoked = $request->user()->token()->revoke();
            if ($revoked) {
                DB::commit();

                return response()->json([
                    "success" => true,
                    "message" => 'Revoked',
                ]);
            }
            DB::rollBack();

            return response()->json([
                "success" => false,
                "message" => 'Something went wrong',
            ]);

        } catch (Exception $exception) {
            DB::rollBack();
            captureException($exception);
            return response()->json([
                "success" => false,
                "message" => $exception->getMessage(),
            ]);

        }

    }

    /**
     * @param Request $request
     * @return Factory|View
     */
    public function domainLogin(Request $request)
    {
        try {
            $email = urldecode($request->email);
            $user = $this->usersRepository->getByEmail($email);
            if ($user) {
                DB::beginTransaction();
                $createdToken = $user->createToken('authToken');
                $accessToken = $createdToken->accessToken;
                $expires = $createdToken->token->expires_at;
                $expires = Carbon::parse($expires)->format('D, d M Y H:m:s');
                DB::commit();

                return view('domainLogin', compact('accessToken', 'expires'));
            }
            return view('domainLogin');

        } catch (Exception $exception) {
            DB::rollBack();
            captureException($exception);
            return view('domainLogin');
        }

    }

    /**
     * @param Request $request
     * @return Factory|View
     */
    public function domainLogout(Request $request)
    {
        return view('domainLogout');
    }

    /**
     * @param Request $request
     * @return JsonResponse
     */
    public function getUserData(Request $request): JsonResponse
    {
        $user = auth()->user();
        $userMeta = DB::table('wp_usermeta')->where('user_id', $user->ID)->get();

        $capability = $userMeta->filter(function ($value) {
            return ($value->meta_key == 'wp_capabilities');
        });

        $isAdmin = $capability->filter(function ($value) {
            return (preg_match('#\b' . preg_quote('administrator', '#') . '\b#i', $value->meta_value) !== 0);
        })->first();

        $isShopManager = $capability->filter(function ($value) {
            return (preg_match('#\b' . preg_quote('shop_manager', '#') . '\b#i', $value->meta_value) !== 0);
        })->first();

        $isFinancialManager = $capability->filter(function ($value) {
            return (preg_match('#\b' . preg_quote('financial_manager', '#') . '\b#i', $value->meta_value) !== 0);
        })->first();

        $isEnterpriseClient = $userMeta->filter(function ($value) {
            return ($value->meta_key == 'enterprise_client') && ($value->meta_value === '1');
        })->first();

        return response()->json([
            "user"               => $user,
            "isAdmin"            => $isAdmin ? true : false,
            "isShopManager"      => $isShopManager ? true : false,
            "isEnterpriseClient" => $isEnterpriseClient ? true : false,
            "isFinancialManager" => $isFinancialManager ? true : false,
        ]);

    }

}
