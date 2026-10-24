package com.recall.backend;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class HealthControllerTests {

	@Test
	void healthReturnsOk() {
		HealthController controller = new HealthController();

		assertThat(controller.health()).containsEntry("status", "ok");
	}

}
