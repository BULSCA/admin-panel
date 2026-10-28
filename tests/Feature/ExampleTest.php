<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;

    public function test_returns_a_successful_response()
    {
        // An Inertia response verifies the page contract without requiring built assets/fonts.
        $response = $this->getJson(route('home'), ['X-Inertia' => 'true']);

        $response->assertOk();
        $response->assertJsonPath('component', 'Welcome');
    }
}
